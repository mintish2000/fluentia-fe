import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from '@shared/services/api/api.service';
import { map, Observable, tap } from 'rxjs';
import { NO_CACHE } from '@core/interceptors/cache.interceptor';
import { StudentHubPayload, StudentHubPlacement, StudentShift } from './student-hub.models';

/**
 * {@code GET /api/v1/student/hub} — placement, group, payments (see FRONTEND_API.md).
 *
 * Owns the hub state as signals so every consumer stays in sync without
 * manual event buses or duplicated HTTP calls.
 */
@Injectable({ providedIn: 'root' })
export class StudentHubService {
  private readonly _api = inject(ApiService);

  /** Latest hub snapshot — shared across all consumers. */
  readonly hub = signal<StudentHubPayload | null>(null);

  /** True while a load is in flight. */
  readonly isLoading = signal(false);

  /**
   * Fetches a fresh hub snapshot, always bypassing the HTTP cache.
   * Updates {@link hub} and {@link isLoading} so all signal consumers
   * react immediately without extra subscriptions.
   */
  load(): Observable<StudentHubPayload> {
    this.isLoading.set(true);
    return this._api
      .get<StudentHubPayload>({
        path: '/student/hub',
        contexts: [{ key: NO_CACHE, value: true }],
      })
      .pipe(
        map((payload) => this._mapPayload(payload)),
        tap({
          next: (payload) => {
            this.hub.set(payload);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        }),
      );
  }

  /**
   * Updates the student's shift preference.
   * {@code PATCH /api/v1/student/shift}
   */
  updateShift(shift: StudentShift) {
    return this._api.patch<{ shift: StudentShift }>({
      path: '/student/shift',
      body: { shift },
    });
  }

  private _mapPayload(payload: StudentHubPayload): StudentHubPayload {
    if (!payload.placement) {
      return payload;
    }

    return {
      ...payload,
      placement: {
        ...payload.placement,
        score: this._mapPlacementScore(payload.placement),
      },
    };
  }

  private _mapPlacementScore(placement: StudentHubPlacement): number {
    const total = Number(placement.totalQuestions);
    const correct = Number(placement.correctAnswers);

    if (Number.isFinite(total) && total > 0 && Number.isFinite(correct) && correct >= 0) {
      return Math.max(0, Math.min(100, Math.round((correct / total) * 100)));
    }

    const rawScore = Number(placement.score);
    if (!Number.isFinite(rawScore)) {
      return 0;
    }

    const normalized = rawScore <= 1 ? rawScore * 100 : rawScore;
    return Math.max(0, Math.min(100, Math.round(normalized)));
  }
}

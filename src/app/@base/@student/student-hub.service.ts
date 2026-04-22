import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/services/api/api.service';
import { map } from 'rxjs';
import { StudentHubPayload, StudentHubPlacement } from './student-hub.models';

/**
 * {@code GET /api/v1/student/hub} — placement, group, payments (see FRONTEND_API.md).
 */
@Injectable({ providedIn: 'root' })
export class StudentHubService {
  private readonly _api = inject(ApiService);

  /**
   * Returns the authenticated student's hub snapshot.
   */
  getHub() {
    return this._api
      .get<StudentHubPayload>({ path: '/student/hub' })
      .pipe(map((payload) => this._mapPayload(payload)));
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

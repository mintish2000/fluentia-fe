import { computed, inject, Injectable, signal } from '@angular/core';
import {
  Quiz,
  Question,
  SubmitPlacementAnswersPayload,
  SubmitPlacementResponse,
} from '@shared/interfaces/learning/learning.interface';
import {
  type PlacementWorkspacePayload,
  resolvePlacementWorkspaceId,
} from '@shared/interfaces/learning/placement-workspace.interface';
import type { StudentHubPayload } from '@base/@student/student-hub.models';
import { UserService } from '@shared/services/user/user.service';
import { ApiService } from '@shared/services/api/api.service';
import {
  mapPlacementRecordsToQuestions,
  mapPlacementWorkspaceToQuiz,
} from '@shared/utils/learning/placement-workspace.mapper';
import { catchError, finalize, forkJoin, Observable, of } from 'rxjs';

/**
 * Student placement gate and exam state using {@code GET /student/hub} + {@code GET /student/placement}
 * and submission via {@code POST /placement/:placementId/submit} (PLACEMENT_SUBMISSION.md).
 */
@Injectable({ providedIn: 'root' })
export class PlacementTestService {
  private readonly _api = inject(ApiService);
  private readonly _userService = inject(UserService);

  readonly isLoadingStatus = signal(false);
  readonly placementQuiz = signal<Quiz | null>(null);
  /** Id for {@code POST /placement/:placementId/submit} (from load payload). */
  readonly placementId = signal<string | null>(null);
  /** Questions for the current attempt (from {@code GET /student/placement}). */
  readonly placementQuestions = signal<Question[]>([]);
  /** Countdown length in seconds (from workspace exam duration). */
  readonly examDurationSeconds = signal(50 * 60);
  readonly hasCompletedPlacement = signal(false);
  readonly isStatusLoaded = signal(false);
  readonly shouldShowPlacementEntry = computed(
    () =>
      this._userService.isStudent &&
      this.isStatusLoaded() &&
      !this.hasCompletedPlacement(),
  );

  /**
   * Loads student hub + placement workspace; derives completion from hub.
   */
  refreshStatus() {
    if (!this._userService.isAuthenticated() || !this._userService.isStudent) {
      this.isStatusLoaded.set(true);
      this.placementQuiz.set(null);
      this.placementQuestions.set([]);
      this.placementId.set(null);
      this.hasCompletedPlacement.set(false);
      return;
    }

    this.isLoadingStatus.set(true);
    this.isStatusLoaded.set(false);

    forkJoin({
      hub: this._api.get<StudentHubPayload>({ path: '/student/hub' }).pipe(
        catchError(() => of(null)),
      ),
      workspace: this._api
        .get<PlacementWorkspacePayload | null>({ path: '/student/placement' })
        .pipe(catchError(() => of(null))),
    })
      .pipe(finalize(() => this.isLoadingStatus.set(false)))
      .subscribe({
        next: ({ hub, workspace }) => {
          this.hasCompletedPlacement.set(!!hub?.placementCompleted);
          this.isStatusLoaded.set(true);
          this._applyWorkspace(workspace);
        },
      });
  }

  /**
   * Applies placement workspace payload to quiz + question signals.
   */
  private _applyWorkspace(workspace: PlacementWorkspacePayload | null) {
    if (!workspace) {
      this.placementQuiz.set(null);
      this.placementQuestions.set([]);
      this.placementId.set(null);
      this.examDurationSeconds.set(50 * 60);
      return;
    }

    const id = resolvePlacementWorkspaceId(workspace);
    this.placementId.set(id || null);

    const quiz = mapPlacementWorkspaceToQuiz(workspace);
    this.placementQuiz.set(quiz);
    this.placementQuestions.set(
      mapPlacementRecordsToQuestions(
        workspace,
        quiz,
        workspace.maxQuestions ?? 50,
      ),
    );
    const minutes = workspace.examDurationMinutes ?? 50;
    this.examDurationSeconds.set(Math.max(60, Math.round(minutes * 60)));
  }

  /**
   * Submits the full placement attempt (PLACEMENT_SUBMISSION.md).
   */
  submitPlacementAnswers(
    placementId: string,
    payload: SubmitPlacementAnswersPayload,
  ): Observable<SubmitPlacementResponse> {
    return this._api.post<SubmitPlacementResponse>({
      path: `/placement/${encodeURIComponent(placementId)}/submit`,
      body: payload,
    });
  }

  /**
   * Marks placement status as completed after successful first attempt.
   */
  markCompleted() {
    this.hasCompletedPlacement.set(true);
    this.isStatusLoaded.set(true);
  }
}

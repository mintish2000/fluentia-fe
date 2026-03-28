import { computed, inject, Injectable, signal } from '@angular/core';
import { Quiz } from '@shared/interfaces/learning/learning.interface';
import { QuizzesService } from '@shared/services/learning/quizzes.service';
import { UserService } from '@shared/services/user/user.service';
import { finalize, forkJoin, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlacementTestService {
  private readonly _quizzesService = inject(QuizzesService);
  private readonly _userService = inject(UserService);

  readonly isLoadingStatus = signal(false);
  readonly placementQuiz = signal<Quiz | null>(null);
  readonly hasCompletedPlacement = signal(false);
  readonly isStatusLoaded = signal(false);
  readonly shouldShowPlacementEntry = computed(
    () =>
      this._userService.isStudent &&
      this.isStatusLoaded() &&
      !this.hasCompletedPlacement(),
  );

  /**
   * Loads placement quiz and resolves if current student has already attempted it.
   */
  refreshStatus() {
    if (!this._userService.isAuthenticated() || !this._userService.isStudent) {
      this.isStatusLoaded.set(true);
      this.placementQuiz.set(null);
      this.hasCompletedPlacement.set(false);
      return;
    }

    this.isLoadingStatus.set(true);
    this.isStatusLoaded.set(false);

    this._quizzesService
      .getPlacementQuiz()
      .pipe(finalize(() => this.isLoadingStatus.set(false)))
      .subscribe({
        next: (placementQuiz) => {
          this.placementQuiz.set(placementQuiz ?? null);

          if (!placementQuiz) {
            this.hasCompletedPlacement.set(false);
            this.isStatusLoaded.set(true);
            return;
          }

          forkJoin({
            attemptStatus: this._quizzesService.getMyQuizAttemptStatus(
              placementQuiz.id,
            ),
            quiz: of(placementQuiz),
          }).subscribe({
            next: ({ attemptStatus }) => {
              this.hasCompletedPlacement.set(!!attemptStatus?.hasAttempt);
              this.isStatusLoaded.set(true);
            },
          });
        },
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

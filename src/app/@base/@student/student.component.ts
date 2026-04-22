import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CoreModule } from '@core/core.module';
import { BaseComponent } from '@shared/components/base/base.component';
import { PlacementTestService } from '@shared/services/learning/placement-test.service';
import { EnglishLevelService } from '@shared/services/learning/english-level.service';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { finalize } from 'rxjs';
import { StudentHubService } from './student-hub.service';
import { StudentHubPayload } from './student-hub.models';

@Component({
  selector: 'app-student',
  imports: [CoreModule, RouterLink, ScrollRevealContainerDirective],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentComponent extends BaseComponent {
  private readonly _placementTestService = inject(PlacementTestService);
  private readonly _englishLevelService = inject(EnglishLevelService);
  private readonly _studentHub = inject(StudentHubService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly currentUser = this._userService.currentUser;
  readonly displayName = computed(() => this.currentUser()?.name || 'Student');
  readonly isLoading = this._isLoading;
  readonly lastSyncedAt = signal<Date | null>(null);
  readonly hub = signal<StudentHubPayload | null>(null);
  readonly hubLoadError = signal<string | null>(null);

  readonly hasCompletedPlacement = this._placementTestService.hasCompletedPlacement;
  readonly isPlacementStatusLoaded = this._placementTestService.isStatusLoaded;

  /**
   * True when hub payload or live quiz attempt indicates placement is completed.
   */
  readonly placementDone = computed(
    () =>
      this.hasCompletedPlacement() || !!this.hub()?.placementCompleted,
  );
  readonly placementEnglishLevel = computed(() => {
    const score = this.hub()?.placement?.score;
    return score == null
      ? null
      : this._englishLevelService.englishLevelFromScore(score);
  });

  /**
   * Full-screen gate until placement is done (logout or take test only).
   * Skipped when hub JSON failed to load so the user can still read the error.
   */
  readonly showPlacementGate = computed(
    () =>
      !this.hubLoadError() &&
      this.hub() !== null &&
      this.isPlacementStatusLoaded() &&
      !this.placementDone(),
  );

  constructor() {
    super();
    this._loadHub();
  }

  /**
   * Loads {@code GET /student/hub} per FRONTEND_API.md.
   */
  private _loadHub() {
    this._isLoading.set(true);
    this.hubLoadError.set(null);
    this._studentHub
      .getHub()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (payload) => {
          this.hub.set(payload);
          this.lastSyncedAt.set(new Date());
        },
        error: () => {
          this.hubLoadError.set('Could not load student data.');
        },
      });
  }

  /**
   * Reloads student hub from the API.
   */
  refreshOverview() {
    this._loadHub();
    this._placementTestService.refreshStatus();
  }

  /**
   * Ends the session (used from placement gate).
   */
  logout() {
    this._authService.kickOut();
  }
}

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
import { TranslateModule } from '@ngx-translate/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CoreModule } from '@core/core.module';
import { BaseComponent } from '@shared/components/base/base.component';
import { PlacementTestService } from '@shared/services/learning/placement-test.service';
import { EnglishLevelService } from '@shared/services/learning/english-level.service';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { finalize } from 'rxjs';
import { StudentHubService } from './student-hub.service';
import { StudentHubPayload, StudentShift } from './student-hub.models';
import { PRICING_PLAN_DETAILS, type PricingPlanId } from '@shared/constants/pricing-plans';

@Component({
  selector: 'app-student',
  imports: [CoreModule, RouterLink, ScrollRevealContainerDirective, TranslateModule, MatSlideToggleModule],
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
  readonly displayName = computed(
    () => this.currentUser()?.name || this._translate.instant('pages.student.fallbackName'),
  );
  readonly isLoading = this._studentHub.isLoading;
  readonly lastSyncedAt = signal<Date | null>(null);
  readonly hub = this._studentHub.hub;
  readonly hubLoadError = signal<string | null>(null);
  readonly shiftSaving = signal(false);
  readonly shiftError = signal<string | null>(null);

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
    this._placementTestService.placementSubmitted$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._loadHub());
    // hub signal in StudentHubService updates automatically after payment
  }

  /**
   * Loads {@code GET /student/hub} per FRONTEND_API.md.
   */
  private _loadHub() {
    this.hubLoadError.set(null);
    this._studentHub
      .load()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => this.lastSyncedAt.set(new Date()),
        error: () => {
          this.hubLoadError.set(this._translate.instant('pages.student.errors.loadFailed'));
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

  /**
   * Returns the human-readable plan description for a given planKey, or null if unknown.
   */
  planDescription(planKey: string | undefined): string | null {
    if (!planKey) {
      return null;
    }
    const details = PRICING_PLAN_DETAILS[planKey as PricingPlanId];
    return details?.description ?? null;
  }

  /**
   * Toggles student shift between morning and evening.
   */
  updateShift(isEvening: boolean) {
    const shift: StudentShift = isEvening ? 'evening' : 'morning';
    this.shiftSaving.set(true);
    this.shiftError.set(null);
    this._studentHub
      .updateShift(shift)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.shiftSaving.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.hub.update((h) => (h ? { ...h, shift: res.shift } : h));
          this._toast.showSuccess(this._translate.instant('pages.student.shift.saved'));
        },
        error: () => {
          this.shiftError.set(this._translate.instant('pages.student.shift.saveFailed'));
        },
      });
  }
}

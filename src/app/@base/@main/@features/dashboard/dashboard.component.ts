import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { BaseComponent } from '@shared/components/base/base.component';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { DashboardMockService } from './dashboard-mock.service';
import { DashboardMockResponse } from './dashboard.models';

/**
 * Builds a `conic-gradient` background for the group distribution donut from mock slices.
 */
function buildGroupConicGradient(data: DashboardMockResponse | null): string {
  const items = data?.studentsByGroup ?? [];
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (total <= 0) {
    return 'conic-gradient(#e2e8f0 0% 100%)';
  }
  let acc = 0;
  const stops: string[] = [];
  for (const item of items) {
    const startPct = (acc / total) * 100;
    acc += item.count;
    const endPct = (acc / total) * 100;
    stops.push(`${item.color} ${startPct}% ${endPct}%`);
  }
  return `conic-gradient(${stops.join(', ')})`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ScrollRevealContainerDirective, TranslateModule],
  providers: [DashboardMockService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent extends BaseComponent {
  private readonly _dashboardMock = inject(DashboardMockService);

  readonly payload = this._dashboardMock.payload;
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly groupDonutBackground = computed(() => buildGroupConicGradient(this.payload()));

  readonly placementMaxCount = computed(() => {
    const bands = this.payload()?.placementScoreDistribution ?? [];
    return Math.max(1, ...bands.map((b) => b.count));
  });

  readonly revenueMaxAmount = computed(() => {
    const rows = this.payload()?.revenueByMonth ?? [];
    return Math.max(1, ...rows.map((r) => r.amountUsd));
  });

  readonly statusTotal = computed(() => {
    const rows = this.payload()?.studentsByStatus ?? [];
    return rows.reduce((sum, r) => sum + r.count, 0) || 1;
  });

  constructor() {
    super();
    this._reload();
  }

  /** Refetches JSON from `/assets/mock/dashboard.json`. */
  refreshDashboard(): void {
    this._reload(true);
  }

  private _reload(force = false): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this._dashboardMock
      .loadDashboard(force)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {},
        error: () => {
          this.loadError.set(this._translate.instant('pages.dashboard.errors.loadFailed'));
        },
      });
  }
}

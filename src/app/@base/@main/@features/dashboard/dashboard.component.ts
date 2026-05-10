import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { BaseComponent } from '@shared/components/base/base.component';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { DashboardService } from './dashboard.service';
import { DashboardResponse } from './dashboard.models';

/** Returns an ISO date string (YYYY-MM-DD) for the given Date. */
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the first day of the current month as an ISO date string. */
function currentMonthStart(): string {
  const d = new Date();
  return toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

/** Returns the last day of the current month as an ISO date string. */
function currentMonthEnd(): string {
  const d = new Date();
  return toIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

/**
 * Builds a `conic-gradient` background for the group distribution donut from API slices.
 */
function buildGroupConicGradient(data: DashboardResponse | null): string {
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
  imports: [CommonModule, FormsModule, ScrollRevealContainerDirective, TranslateModule],
  providers: [DashboardService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent extends BaseComponent {
  private readonly _dashboard = inject(DashboardService);

  readonly payload = this._dashboard.payload;
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  /** Required query params – default to the current calendar month. */
  readonly fromDate = signal<string>(currentMonthStart());
  readonly toDate = signal<string>(currentMonthEnd());

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

  /** Called when the user submits the date-range filter form. */
  applyDateRange(): void {
    this._reload();
  }

  /** Refetches dashboard data from `GET /admin/dashboard`. */
  refreshDashboard(): void {
    this._reload();
  }

  private _reload(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this._dashboard
      .loadDashboard({ from: this.fromDate(), to: this.toDate() })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {},
        error: () => {
          this.loadError.set(this._translate.instant('pages.dashboard.errors.loadFailed'));
        },
      });
  }
}

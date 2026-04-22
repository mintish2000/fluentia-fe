import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from '@shared/services/api/api.service';
import { DashboardResponse } from './dashboard.models';
import { Observable, tap } from 'rxjs';

export interface DashboardQueryParams {
  from: string; // required – ISO date string, e.g. "2026-04-01"
  to: string;   // required – ISO date string, e.g. "2026-04-30"
}

@Injectable()
export class DashboardService {
  private readonly _api = inject(ApiService);

  readonly payload = signal<DashboardResponse | null>(null);

  /**
   * Loads dashboard data from `GET /admin/dashboard`.
   * `from` and `to` are required query parameters.
   * Requires a valid Bearer JWT with admin role (handled by the HTTP interceptor).
   */
  loadDashboard(params: DashboardQueryParams): Observable<DashboardResponse> {
    return this._api
      .get<DashboardResponse>({ path: '/admin/dashboard', params: { ...params } })
      .pipe(tap((data) => this.payload.set(data)));
  }
}

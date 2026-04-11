import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { DashboardMockResponse } from './dashboard.models';
import { Observable, of, tap } from 'rxjs';

@Injectable()
export class DashboardMockService {
  private readonly _http = inject(HttpClient);

  readonly payload = signal<DashboardMockResponse | null>(null);

  /**
   * Loads dashboard chart data from `/assets/mock/dashboard.json`.
   */
  loadDashboard(force = false): Observable<DashboardMockResponse> {
    if (!force && this.payload()) {
      return of(this.payload() as DashboardMockResponse);
    }

    return this._http.get<DashboardMockResponse>('/assets/mock/dashboard.json').pipe(
      tap((data) => this.payload.set(data)),
    );
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { GroupDraft, AdminGroupsPayload, StudentGroup } from '../models/admin-group.models';
import { Observable, map, of, tap } from 'rxjs';
import { AdminApiService } from './admin-api.service';

/**
 * In-memory groups list; synced from {@code GET /admin/hub} and group CRUD routes.
 */
@Injectable()
export class AdminGroupStoreService {
  private readonly _adminApi = inject(AdminApiService);

  readonly groups = signal<StudentGroup[]>([]);

  /**
   * Applies the groups bundle from {@code GET /admin/hub}.
   */
  applyFromHub(payload: AdminGroupsPayload): void {
    this.groups.set((payload.groups ?? []).slice());
    this._sortGroups();
  }

  /**
   * Loads groups from {@code GET /admin/groups}.
   */
  loadGroups(force = false): Observable<StudentGroup[]> {
    if (!force && this.groups().length) {
      return of(this.groups().slice());
    }

    return this._adminApi.getGroups().pipe(
      tap((payload) => {
        this.applyFromHub(payload);
      }),
      map(() => this.groups().slice()),
    );
  }

  createGroup(draft: GroupDraft): Observable<StudentGroup> {
    return this._adminApi.createGroup(draft).pipe(
      tap((created) => {
        this.groups.update((list) => [...list, created]);
        this._sortGroups();
      }),
    );
  }

  updateGroup(groupId: string, draft: GroupDraft): Observable<StudentGroup> {
    return this._adminApi.updateGroup(groupId, draft).pipe(
      tap((updated) => {
        this.groups.update((list) => list.map((g) => (g.id === groupId ? updated : g)));
        this._sortGroups();
      }),
    );
  }

  deleteGroup(groupId: string): Observable<void> {
    return this._adminApi.deleteGroup(groupId).pipe(
      tap(() => {
        this.groups.update((list) => list.filter((g) => g.id !== groupId));
      }),
    );
  }

  private _sortGroups() {
    this.groups.update((list) =>
      list.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    );
  }
}

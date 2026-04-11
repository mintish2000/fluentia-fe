import { Injectable, inject, signal } from '@angular/core';
import { ToastService } from '@shared/services/toast/toast.service';
import { finalize } from 'rxjs';
import { GroupDraft } from '../models/admin-group.models';
import { AdminGroupStoreService } from './admin-group-store.service';
import { AdminStudentStoreService } from './admin-student-store.service';

@Injectable()
export class AdminGroupService {
  private readonly _groupStore = inject(AdminGroupStoreService);
  private readonly _studentStore = inject(AdminStudentStoreService);
  private readonly _toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly isOverviewLoaded = signal(false);
  readonly groups = this._groupStore.groups;

  /**
   * Call after {@code GET /admin/hub} hydrates groups so {@link ensureGroupsLoaded} does not refetch.
   */
  markLoadedFromHub(): void {
    this.isOverviewLoaded.set(true);
  }

  /**
   * Loads groups from {@code GET /admin/groups} (or uses cache when already loaded).
   */
  loadGroups(force = false) {
    if (!force && this.isOverviewLoaded()) {
      return;
    }
    this.isLoading.set(true);
    this._groupStore
      .loadGroups(force)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.isOverviewLoaded.set(true);
        },
      });
  }

  ensureGroupsLoaded() {
    this.loadGroups(false);
  }

  refreshGroups() {
    this.isOverviewLoaded.set(false);
    this.loadGroups(true);
  }

  /**
   * Creates a group and shows a success toast.
   */
  createGroup(draft: GroupDraft) {
    this.isLoading.set(true);
    this._groupStore
      .createGroup(draft)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Group created successfully.');
          this.isOverviewLoaded.set(true);
        },
      });
  }

  /**
   * Updates a group and shows a success toast.
   */
  updateGroup(groupId: string, draft: GroupDraft) {
    this.isLoading.set(true);
    this._groupStore
      .updateGroup(groupId, draft)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Group updated successfully.');
        },
      });
  }

  /**
   * Deletes a group, clears student assignments locally, and shows a toast.
   */
  deleteGroup(groupId: string) {
    this.isLoading.set(true);
    this._groupStore
      .deleteGroup(groupId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this._studentStore.clearGroupIdForStudents(groupId);
          this._toast.showSuccess('Group deleted successfully.');
        },
      });
  }
}

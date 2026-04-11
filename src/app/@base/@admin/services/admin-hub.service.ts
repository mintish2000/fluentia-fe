import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastService } from '@shared/services/toast/toast.service';
import { catchError, EMPTY, finalize } from 'rxjs';
import { AdminStudentStoreService } from './admin-student-store.service';
import { AdminStudent, AdminStudentDraft } from '../models/admin-student.models';
import { AdminApiService } from './admin-api.service';
import { AdminPlacementService } from './admin-placement.service';
import { AdminGroupStoreService } from './admin-group-store.service';
import { AdminGroupService } from './admin-group.service';

/**
 * Admin shell state: loads {@code GET /admin/hub} and coordinates student CRUD via API.
 */
@Injectable()
export class AdminHubService {
  private readonly _studentStore = inject(AdminStudentStoreService);
  private readonly _groupStore = inject(AdminGroupStoreService);
  private readonly _groupUi = inject(AdminGroupService);
  private readonly _placement = inject(AdminPlacementService);
  private readonly _adminApi = inject(AdminApiService);
  private readonly _toast = inject(ToastService);

  /** Display name from hub {@code students.meta.adminDisplayName}, or a safe default. */
  readonly displayName = computed(
    () => this._studentStore.meta()?.adminDisplayName?.trim() || 'Admin',
  );
  readonly isLoading = signal(false);
  readonly lastSyncedAt = signal<Date | null>(null);

  readonly students = this._studentStore.students;
  readonly selectedStudentId = signal<string | null>(null);

  readonly listedStudents = computed(() => this.students());
  readonly selectedStudent = computed(() => {
    const id = this.selectedStudentId();
    if (!id) {
      return this.students()[0] ?? null;
    }
    return this.students().find((student) => student.id === id) ?? null;
  });

  readonly activeStudentsCount = computed(
    () => this.students().filter((student) => student.status === 'active').length,
  );
  readonly inactiveStudentsCount = computed(
    () => this.students().filter((student) => student.status === 'inactive').length,
  );
  readonly totalPaidAmount = computed(() =>
    this.students().reduce(
      (sum, student) =>
        sum +
        student.payments
          .filter((payment) => payment.status === 'paid')
          .reduce((inner, payment) => inner + Number(payment.amount), 0),
      0,
    ),
  );

  private _isLoaded = false;

  ensureUsersTabLoaded() {
    if (!this._isLoaded) {
      this.loadAdminOverview(true);
    }
  }

  /**
   * Loads {@code GET /admin/hub} and hydrates students, groups, and placement workspace.
   */
  loadAdminOverview(force = true) {
    if (!force && this._isLoaded) {
      return;
    }

    this.isLoading.set(true);
    this._adminApi
      .getHub()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError(() => {
          this._toast.showError('Could not load admin hub.');
          return EMPTY;
        }),
      )
      .subscribe({
        next: (hub) => {
          this._studentStore.applyFromHub(hub.students);
          this._groupStore.applyFromHub(hub.groups);
          this._groupUi.markLoadedFromHub();
          this._placement.hydrateFromWorkspacePayload(hub.placement);
          this._isLoaded = true;
          this.lastSyncedAt.set(new Date());
          const roster = this.students();
          if (!roster.length) {
            this.selectedStudentId.set(null);
            return;
          }
          if (!this.selectedStudentId()) {
            this.selectedStudentId.set(roster[0].id);
          }
        },
      });
  }

  setSelectedStudent(studentId: string) {
    this.selectedStudentId.set(studentId);
  }

  createStudent(draft: AdminStudentDraft) {
    this.isLoading.set(true);
    this._studentStore
      .createStudent(draft)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (created) => {
          this.selectedStudentId.set(created.id);
          this.lastSyncedAt.set(new Date());
          this._toast.showSuccess('Student created successfully.');
        },
        error: () => {
          this._toast.showError('Could not create student.');
        },
      });
  }

  updateStudent(studentId: string, draft: AdminStudentDraft) {
    this.isLoading.set(true);
    this._studentStore
      .updateStudent(studentId, draft)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.lastSyncedAt.set(new Date());
          this._toast.showSuccess('Student updated successfully.');
        },
        error: () => {
          this._toast.showError('Could not update student.');
        },
      });
  }

  toggleStudentStatus(student: AdminStudent) {
    this.isLoading.set(true);
    this._studentStore
      .toggleStudentStatus(student.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.lastSyncedAt.set(new Date());
          this._toast.showSuccess(
            student.status === 'active'
              ? 'Student deactivated successfully.'
              : 'Student activated successfully.',
          );
        },
        error: () => {
          this._toast.showError('Could not update student status.');
        },
      });
  }

  deleteStudent(student: AdminStudent) {
    this.isLoading.set(true);
    this._studentStore
      .deleteStudent(student.id)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.lastSyncedAt.set(new Date());
          const remaining = this.students();
          this.selectedStudentId.set(remaining[0]?.id ?? null);
          this._toast.showSuccess('Student deleted successfully.');
        },
        error: () => {
          this._toast.showError('Could not delete student.');
        },
      });
  }
}

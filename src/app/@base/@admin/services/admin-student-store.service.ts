import { Injectable, inject, signal } from '@angular/core';
import {
  AdminStudent,
  AdminStudentDraft,
  AdminStudentsMeta,
  AdminStudentsPayload,
} from '../models/admin-student.models';
import { Observable, map, of, tap } from 'rxjs';
import { AdminApiService } from './admin-api.service';

/**
 * In-memory admin student roster; synced from {@code GET /admin/hub} and CRUD routes.
 */
@Injectable()
export class AdminStudentStoreService {
  private readonly _adminApi = inject(AdminApiService);

  readonly students = signal<AdminStudent[]>([]);

  /** Hub display name from {@code students.meta} (null before first load). */
  readonly meta = signal<AdminStudentsMeta | null>(null);

  /**
   * Applies the students bundle from {@code GET /admin/hub}.
   */
  applyFromHub(payload: AdminStudentsPayload): void {
    this.meta.set(payload.meta ?? null);
    this.students.set((payload.students ?? []).map((s) => this._normalizeStudent(s)));
    this._sortStudents();
  }

  /**
   * Legacy no-op list accessor (roster is filled by hub).
   */
  loadStudents(_force = false): Observable<AdminStudent[]> {
    return of(this.students().slice());
  }

  createStudent(draft: AdminStudentDraft): Observable<AdminStudent> {
    return this._adminApi.createStudent(draft).pipe(
      tap((created) => {
        this.students.update((list) => {
          const next = [...list, this._normalizeStudent(created)];
          return next.sort((a, b) =>
            `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
          );
        });
      }),
    );
  }

  updateStudent(studentId: string, draft: AdminStudentDraft): Observable<AdminStudent> {
    return this._adminApi.updateStudent(studentId, draft).pipe(
      tap((updated) => {
        const normalized = this._normalizeStudent(updated);
        this.students.update((list) =>
          list.map((item) => (item.id === studentId ? normalized : item)),
        );
        this._sortStudents();
      }),
    );
  }

  toggleStudentStatus(studentId: string): Observable<void> {
    const current = this.students().find((item) => item.id === studentId);
    if (!current) {
      throw new Error('Student not found.');
    }
    const nextStatus = current.status === 'active' ? 'inactive' : 'active';
    return this._adminApi.patchStudentStatus(studentId, nextStatus).pipe(
      tap((updated) => {
        const normalized = this._normalizeStudent(updated);
        this.students.update((list) =>
          list.map((item) => (item.id === studentId ? normalized : item)),
        );
        this._sortStudents();
      }),
      map(() => void 0),
    );
  }

  deleteStudent(studentId: string): Observable<void> {
    return this._adminApi.deleteStudent(studentId).pipe(
      tap(() => {
        this.students.update((list) => list.filter((item) => item.id !== studentId));
      }),
    );
  }

  /**
   * Clears `groupId` for students assigned to a deleted group (optimistic client sync).
   */
  clearGroupIdForStudents(groupId: string): void {
    this.students.update((list) =>
      list.map((item) =>
        item.groupId === groupId
          ? { ...item, groupId: null, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  }

  private _normalizeStudent(raw: AdminStudent): AdminStudent {
    return {
      ...raw,
      groupId: raw.groupId ?? null,
      notes: raw.notes ?? '',
      nextPaymentDate:
        typeof raw.nextPaymentDate === 'string'
          ? raw.nextPaymentDate
          : (raw.nextPaymentDate as unknown as Date)?.toISOString?.() ?? '',
    };
  }

  private _sortStudents() {
    this.students.update((list) =>
      list
        .slice()
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    );
  }
}

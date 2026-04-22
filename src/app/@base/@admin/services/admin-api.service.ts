import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/services/api/api.service';
import { AdminHubResponse, AdminMeResponse } from '../models/admin-hub-api.models';
import { AdminStudent, AdminStudentDraft } from '../models/admin-student.models';
import { GroupDraft, AdminGroupsPayload, StudentGroup } from '../models/admin-group.models';
import { PlacementWorkspacePayload } from '../models/admin-placement.models';

/**
 * HTTP client for NestJS admin routes under {@code /api/v1/admin/*} (see FRONTEND_API.md).
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly _api = inject(ApiService);

  /**
   * Bootstrap payload: dashboard, students, groups, and placement workspace.
   */
  getHub() {
    return this._api.get<AdminHubResponse>({ path: '/admin/hub' });
  }

  /**
   * Shell display name for the signed-in admin.
   */
  getMe() {
    return this._api.get<AdminMeResponse>({ path: '/admin/me' });
  }

  getPlacement() {
    return this._api.get<PlacementWorkspacePayload | null>({
      path: '/admin/placement',
    });
  }

  getGroups() {
    return this._api.get<AdminGroupsPayload>({ path: '/admin/groups' });
  }

  createStudent(draft: AdminStudentDraft) {
    return this._api.post<AdminStudent>({
      path: '/admin/students',
      body: this.buildStudentPayload(draft),
    });
  }

  updateStudent(studentId: string, draft: AdminStudentDraft) {
    return this._api.patch<AdminStudent>({
      path: `/admin/students/${encodeURIComponent(studentId)}`,
      body: this.buildStudentPayload(draft),
    });
  }

  patchStudentStatus(studentId: string, status: 'active' | 'inactive') {
    return this._api.patch<AdminStudent>({
      path: `/admin/students/${encodeURIComponent(studentId)}/status`,
      body: { status },
    });
  }

  deleteStudent(studentId: string) {
    return this._api.delete<void>({
      path: `/admin/students/${encodeURIComponent(studentId)}`,
    });
  }

  createGroup(body: GroupDraft) {
    return this._api.post<StudentGroup>({
      path: '/admin/groups',
      body: {
        name: body.name.trim(),
        description: (body.description ?? '').trim(),
        link: body.link.trim(),
      },
    });
  }

  updateGroup(groupId: string, body: GroupDraft) {
    return this._api.patch<StudentGroup>({
      path: `/admin/groups/${encodeURIComponent(groupId)}`,
      body: {
        name: body.name.trim(),
        description: (body.description ?? '').trim(),
        link: body.link.trim(),
      },
    });
  }

  deleteGroup(groupId: string) {
    return this._api.delete<void>({
      path: `/admin/groups/${encodeURIComponent(groupId)}`,
    });
  }

  createPlacementQuestion(body: {
    prompt: string;
    type: string;
    options: string[];
    correctAnswer: string;
  }) {
    return this._api.post<{ id: string }>({
      path: '/admin/placement/questions',
      body,
    });
  }

  updatePlacementQuestion(
    questionId: string,
    body: {
      prompt: string;
      type: string;
      options: string[];
      correctAnswer: string;
    },
  ) {
    return this._api.patch<void>({
      path: `/admin/placement/questions/${encodeURIComponent(questionId)}`,
      body,
    });
  }

  deletePlacementQuestion(questionId: string) {
    return this._api.delete<void>({
      path: `/admin/placement/questions/${encodeURIComponent(questionId)}`,
    });
  }

  /**
   * Shared create/update body for student roster (see FRONTEND_API.md).
   */
  buildStudentPayload(draft: AdminStudentDraft): Record<string, unknown> {
    const password = (draft.password ?? '').trim();
    return {
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim().toLowerCase(),
      status: draft.status,
      ...(password ? { password } : {}),
      groupId: draft.groupId || null,
      notes: draft.notes.trim(),
      nextPaymentDate: draft.nextPaymentDate,
      nextPaymentAmount: draft.nextPaymentAmount,
    };
  }
}

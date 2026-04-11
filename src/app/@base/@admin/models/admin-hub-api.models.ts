import type { AdminStudentsPayload } from './admin-student.models';
import type { AdminGroupsPayload } from './admin-group.models';
import type { PlacementWorkspacePayload } from './admin-placement.models';

/**
 * Response shape for {@code GET /api/v1/admin/hub} (see FRONTEND_API.md).
 */
export interface AdminHubResponse {
  dashboard: unknown;
  students: AdminStudentsPayload;
  groups: AdminGroupsPayload;
  placement: PlacementWorkspacePayload | null;
}

/**
 * Response shape for {@code GET /api/v1/admin/me}.
 */
export interface AdminMeResponse {
  adminDisplayName: string;
  role: string;
}

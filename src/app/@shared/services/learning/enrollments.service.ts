import { inject, Injectable } from '@angular/core';
import {
  BackendUser,
  Course,
  Enrollment,
  InfinityListResponse,
  PaginationQuery,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

type CreateEnrollmentPayload = {
  course: Pick<Course, 'id'>;
  student: Pick<BackendUser, 'id'>;
  progress?: number | null;
  status: string;
};

@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  private _api = inject(ApiService);

  /**
   * Returns paginated enrollment records.
   */
  getEnrollments(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<Enrollment>>({
      path: '/enrollments',
      params,
    });
  }

  /**
   * Creates a new enrollment record.
   */
  createEnrollment(payload: CreateEnrollmentPayload) {
    return this._api.post<Enrollment>({
      path: '/enrollments',
      body: payload,
    });
  }

  /**
   * Updates enrollment fields (for progress/status sync).
   */
  updateEnrollment(
    enrollmentId: string,
    payload: Partial<CreateEnrollmentPayload>,
  ) {
    return this._api.patch<Enrollment>({
      path: `/enrollments/${enrollmentId}`,
      body: payload,
    });
  }
}

import { inject, Injectable } from '@angular/core';
import {
  BackendUser,
  Course,
  InfinityListResponse,
  PaginationQuery,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

type UpsertCoursePayload = {
  tutor: Pick<BackendUser, 'id'>;
  title: string;
  level: string;
  price?: number | null;
  description?: string | null;
};

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private _api = inject(ApiService);

  /**
   * Returns paginated course catalog records.
   */
  getCourses(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<Course>>({
      path: '/courses',
      params,
    });
  }

  /**
   * Returns a single course by id.
   */
  getCourseById(courseId: string) {
    return this._api.get<Course>({
      path: `/courses/${courseId}`,
    });
  }

  /**
   * Creates a new course.
   */
  createCourse(payload: UpsertCoursePayload) {
    return this._api.post<Course>({
      path: '/courses',
      body: payload,
    });
  }

  /**
   * Updates an existing course.
   */
  updateCourse(courseId: string, payload: Partial<UpsertCoursePayload>) {
    return this._api.patch<Course>({
      path: `/courses/${courseId}`,
      body: payload,
    });
  }

  /**
   * Deletes a course by id.
   */
  deleteCourse(courseId: string) {
    return this._api.delete<void>({
      path: `/courses/${courseId}`,
    });
  }
}

import { inject, Injectable } from '@angular/core';
import {
  Course,
  InfinityListResponse,
  Lesson,
  PaginationQuery,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

type UpsertLessonPayload = {
  course: Pick<Course, 'id'>;
  lessonOrder: number;
  title: string;
  videoUrl?: string | null;
  content?: string | null;
};

@Injectable({ providedIn: 'root' })
export class LessonsService {
  private _api = inject(ApiService);

  /**
   * Returns paginated lessons.
   */
  getLessons(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<Lesson>>({
      path: '/lessons',
      params,
    });
  }

  /**
   * Returns one lesson by id.
   */
  getLessonById(lessonId: string) {
    return this._api.get<Lesson>({
      path: `/lessons/${lessonId}`,
    });
  }

  /**
   * Creates a new lesson.
   */
  createLesson(payload: UpsertLessonPayload) {
    return this._api.post<Lesson>({
      path: '/lessons',
      body: payload,
    });
  }

  /**
   * Updates an existing lesson.
   */
  updateLesson(lessonId: string, payload: Partial<UpsertLessonPayload>) {
    return this._api.patch<Lesson>({
      path: `/lessons/${lessonId}`,
      body: payload,
    });
  }

  /**
   * Deletes lesson by id.
   */
  deleteLesson(lessonId: string) {
    return this._api.delete<void>({
      path: `/lessons/${lessonId}`,
    });
  }
}

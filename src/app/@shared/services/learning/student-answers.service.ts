import { inject, Injectable } from '@angular/core';
import {
  InfinityListResponse,
  PaginationQuery,
  StudentAnswer,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({ providedIn: 'root' })
export class StudentAnswersService {
  private _api = inject(ApiService);

  /**
   * Returns paginated student answer records.
   */
  getStudentAnswers(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<StudentAnswer>>({
      path: '/student-answers',
      params,
    });
  }
}

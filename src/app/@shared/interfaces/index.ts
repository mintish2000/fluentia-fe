import { Observable } from "rxjs";

export interface ApiResult<T = unknown> {
  Data: T;
  StatusCode: number;
  Errors: string[];
  hasError?: boolean;
}

export type ApiGridResult<T = unknown> = ApiResult<{
  items: T[];
  totalCount: number;
}>;

export interface AbstractResponseData {
  id: number;
  name: string;
}

export interface PaginationFilter {
  limit?: number;
  offset?: number;
  search?: string;
}

export type CanDeactivateComponent = {
  canDeactivate: Observable<boolean>;
};

export * from './learning/learning.interface';
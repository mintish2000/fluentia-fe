import { HttpInterceptorFn } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { CacheInterceptor } from './cache.interceptor';
import { ErrorInterceptor } from './error.interceptor';

export { NO_CACHE } from './cache.interceptor';
export { clearHttpCache } from './cache.interceptor';

export const appHttpInterceptors: HttpInterceptorFn[] = [
  AuthInterceptor,
  CacheInterceptor,
  ErrorInterceptor,
];

import { HttpInterceptorFn } from '@angular/common/http';
import { AuthInterceptor } from './auth.interceptor';
import { ErrorInterceptor } from './error.interceptor';

export const appHttpInterceptors: HttpInterceptorFn[] = [
  AuthInterceptor,
  ErrorInterceptor,
];

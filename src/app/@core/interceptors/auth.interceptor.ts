import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LocalStorageService } from '@shared/services/local-storage/local-storage.service';
import { Observable } from 'rxjs';
import { ACCEPT_HEADER } from './tokens';

export const AuthInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const translateService = inject(TranslateService);
  const currentLang = translateService.currentLang || 'en';
  const localStorageService = inject(LocalStorageService);
  const acceptHeader = req.context.get(ACCEPT_HEADER) || 'application/json';
  const isRefreshRequest = _isRefreshRequest(req.url);
  const tokenKey = isRefreshRequest ? 'refresh-token' : 'access-token';
  const token = localStorageService.getItem<string>(tokenKey);
  const headersConfig: Record<string, string> = {
    Accept: acceptHeader,
    'Accept-Language': currentLang,
    'x-locale': currentLang,
  };

  if (token) {
    headersConfig['Authorization'] = `Bearer ${token}`;
  }

  const clonedReq = req.clone({
    setHeaders: headersConfig,
    withCredentials: false,
  });

  return next(clonedReq);
};

/**
 * Checks whether the request targets the refresh-token endpoint.
 */
function _isRefreshRequest(url: string): boolean {
  return /\/auth\/refresh(?:\?.*)?$/.test(url);
}

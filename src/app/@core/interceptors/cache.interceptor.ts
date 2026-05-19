import {
  HttpContextToken,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

export const NO_CACHE = new HttpContextToken<boolean>(() => false);

const _cache = new Map<string, HttpResponse<unknown>>();

export const CacheInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (req.method !== 'GET' || req.context.get(NO_CACHE)) {
    return next(req);
  }

  const cached = _cache.get(req.urlWithParams);
  if (cached) {
    return of(cached.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        _cache.set(req.urlWithParams, event.clone());
      }
    }),
  );
};

export function clearHttpCache(): void {
  _cache.clear();
}

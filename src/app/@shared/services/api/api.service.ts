import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@environments/environment';

interface APIQueryParam {
  [key: string]: any;
}

interface SanitizedQueryParams {
  [key: string]:
    | string
    | number
    | boolean
    | ReadonlyArray<string | number | boolean>;
}

interface APIBody {
  [key: string]: any;
}

export interface APIContext {
  key: HttpContextToken<any>;
  value: any;
}

interface APIOptions {
  path: string;
  params?: APIQueryParam;
  responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
  observe?: 'body' | 'events' | 'response';
  reportProgress?: boolean;
  body?: APIBody;
  withCredentials?: boolean;
  contexts?: APIContext[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private _baseUrl: string;
  private _http = inject(HttpClient);

  constructor() {
    this._baseUrl = environment.apiUrl.replace(/\/+$/, '');
  }

  get<T = unknown>(options: APIOptions = { path: '' }) {
    const sanitizedQueryParams = this._sanitizeQueryParams(
      options.params ?? {},
    );
    const url = this._buildUrl(options.path);
    const httpParams: HttpParams = new HttpParams({
      fromObject: sanitizedQueryParams,
    });

    return this._http.get<T>(url, {
      params: httpParams,
      responseType: (options.responseType as 'json') || 'json',
      observe: (options.observe as 'body') || 'body',
      context: _handleContexts(options.contexts),
      withCredentials: options.withCredentials ?? false,
    });
  }

  post<T = unknown>(options: APIOptions = { path: '' }) {
    const url = this._buildUrl(options.path);
    const sanitizedQueryParams = this._sanitizeQueryParams(
      options.params ?? {},
    );
    const httpParams: HttpParams = new HttpParams({
      fromObject: sanitizedQueryParams,
    });

    return this._http.post<T>(url, options.body, {
      params: httpParams,
      responseType: (options.responseType as 'json') || 'json',
      observe: (options.observe as 'body') || 'body',
      context: _handleContexts(options.contexts),
      withCredentials: options.withCredentials ?? false,
    });
  }

  delete<T = unknown>(options: APIOptions = { path: '' }) {
    const url = this._buildUrl(options.path);
    const sanitizedQueryParams = this._sanitizeQueryParams(
      options.params ?? {},
    );
    const httpParams: HttpParams = new HttpParams({
      fromObject: sanitizedQueryParams,
    });
    return this._http.delete<T>(url, {
      params: httpParams,
      body: options.body,
      responseType: (options.responseType as 'json') || 'json',
      observe: (options.observe as 'body') || 'body',
      context: _handleContexts(options.contexts),
      withCredentials: options.withCredentials ?? false,
    });
  }

  patch<T = unknown>(options: APIOptions = { path: '' }) {
    const url = this._buildUrl(options.path);
    const sanitizedQueryParams = this._sanitizeQueryParams(
      options.params ?? {},
    );
    const httpParams: HttpParams = new HttpParams({
      fromObject: sanitizedQueryParams,
    });
    return this._http.patch<T>(url, options.body, {
      params: httpParams,
      responseType: (options.responseType as 'json') || 'json',
      observe: (options.observe as 'body') || 'body',
      context: _handleContexts(options.contexts),
      withCredentials: options.withCredentials ?? false,
    });
  }

  put<T = unknown>(options: APIOptions = { path: '' }) {
    const url = this._buildUrl(options.path);
    const sanitizedQueryParams = this._sanitizeQueryParams(
      options.params ?? {},
    );
    const httpParams: HttpParams = new HttpParams({
      fromObject: sanitizedQueryParams,
    });

    return this._http.put<T>(url, options.body, {
      params: httpParams,
      responseType: (options.responseType as 'json') || 'json',
      observe: (options.observe as 'body') || 'body',
      context: _handleContexts(options.contexts),
      withCredentials: options.withCredentials ?? false,
    });
  }

  // Clean Object from falsy values.
  private _sanitizeQueryParams(params: APIQueryParam): SanitizedQueryParams {
    for (const param of Object.keys(params)) {
      const value = params[param];

      if (value == undefined || value == null || value == '')
        delete params[param];
    }

    return params as SanitizedQueryParams;
  }

  /**
   * Builds a consistent absolute API URL from a relative path.
   */
  private _buildUrl(path: string = ''): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this._baseUrl}${normalizedPath}`;
  }
}

function _handleContexts(_contexts: APIContext[] | undefined): HttpContext {
  const contexts: APIContext[] = _contexts || [];
  const httpContext = new HttpContext();

  for (const context of contexts) {
    const httpContextValue = new HttpContextToken<any>(() => context.value);
    httpContext.set(context.key, httpContextValue.defaultValue() ?? true);
  }

  return httpContext;
}

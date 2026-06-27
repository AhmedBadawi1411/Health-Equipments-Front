import { HttpClient, HttpHeaders, HttpContext, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class HttpClientWrapper {
  constructor(private readonly http: HttpClient) {}

  get<T>(url: string, options?: AppRequestOptions) {
    return this.http.get<T>(url, { withCredentials: true, ...options });
  }

  post<T>(url: string, body?: unknown, options?: AppRequestOptions) {
    return this.http.post<T>(url, body, { withCredentials: true, ...options });
  }

  put<T>(url: string, body?: unknown, options?: AppRequestOptions) {
    return this.http.put<T>(url, body, { withCredentials: true, ...options });
  }

  patch<T>(url: string, body?: unknown, options?: AppRequestOptions) {
    return this.http.patch<T>(url, body, { withCredentials: true, ...options });
  }

  delete<T>(url: string, options?: AppRequestOptions) {
    return this.http.delete<T>(url, { withCredentials: true, ...options });
  }
}

export type AppRequestOptions = {
  headers?: HttpHeaders | Record<string, string | string[]>;
  context?: HttpContext;
  params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
  reportProgress?: boolean;
  responseType?: 'json';
  withCredentials?: boolean;
  transferCache?: { includeHeaders?: string[] } | boolean;
};
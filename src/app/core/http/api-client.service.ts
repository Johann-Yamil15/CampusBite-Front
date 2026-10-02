import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppConfigService } from '@core/config/app-config.service';

type QueryParams = Record<
  string,
  string | number | boolean | readonly (string | number | boolean)[]
>;

/**
 * Cliente HTTP base. Las implementaciones de repositorios (capa data) lo usan
 * para no repetir la URL base ni la construcción de parámetros.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(AppConfigService);

  get<T>(path: string, params?: QueryParams): Observable<T> {
    return this.http.get<T>(this.url(path), { params: this.toParams(params) });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  patch<T>(path: string, body: unknown): Observable<T> {
    return this.http.patch<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    return `${this.config.apiUrl}/${path.replace(/^\/+/, '')}`;
  }

  private toParams(params?: QueryParams): HttpParams | undefined {
    return params ? new HttpParams({ fromObject: params }) : undefined;
  }
}

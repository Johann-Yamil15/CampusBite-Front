import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { LoggerService } from '@core/services/logger.service';
import { TokenStorageService } from '@core/services/token-storage.service';

interface ProblemDetails {
  title?: string;
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

/** Normaliza cualquier error HTTP a `ApiError` y gestiona la sesión expirada (401). */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokens = inject(TokenStorageService);
  const logger = inject(LoggerService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      if (err.status === 401) {
        tokens.clear();
        void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      const body = (typeof err.error === 'object' ? err.error : null) as ProblemDetails | null;
      const apiError: ApiError = {
        status: err.status,
        message: body?.detail ?? body?.message ?? body?.title ?? defaultMessage(err.status),
        errors: body?.errors,
      };

      logger.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, apiError);
      return throwError(() => apiError);
    }),
  );
};

function defaultMessage(status: number): string {
  switch (status) {
    case 0:
      return 'No se pudo conectar con el servidor.';
    case 403:
      return 'No tienes permisos para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 500:
      return 'Error interno del servidor.';
    default:
      return 'Ocurrió un error inesperado.';
  }
}

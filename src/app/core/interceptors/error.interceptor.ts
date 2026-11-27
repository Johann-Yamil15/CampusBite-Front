import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { LoggerService } from '@core/services/logger.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { ConexionService } from '@core/services/conexion.service';
import { NO_ENVIADO } from '@core/interceptors/sin-conexion.interceptor';

/** CL-Sprint5 26/11/2026: mensajes de status 0 (sin respuesta). */
export const MENSAJE_SIN_INTERNET = 'Sin conexión a internet. Revisa tu red e inténtalo de nuevo.';
export const MENSAJE_SIN_SERVIDOR = 'No pudimos conectar con CampusBite. Inténtalo en unos momentos.';

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
  const conexion = inject(ConexionService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      // Solo es "sesión expirada" si la petición llevaba token; un 401 del login
      // (credenciales incorrectas) lo maneja la página sin redirigir.
      if (err.status === 401 && req.headers.has('Authorization')) {
        tokens.clear();
        void router.navigate(['/auth/login'], { queryParams: { returnUrl: router.url } });
      }

      // CL-Sprint5 26/11/2026: con status 0 no hay respuesta del servidor; el cuerpo es el error del
      // navegador ("Failed to fetch", en inglés), así que siempre se usa el mensaje propio.
      // Un 504 también es "sin respuesta": es lo que devuelve el service worker de Angular cuando la red
      // falla (y lo que da una pasarela cuando el back no contesta). Mismo mensaje; se conserva el 504 para
      // quien tenga un texto propio (p. ej. la subida de imágenes del panel).
      if (err.status === 0 || err.status === 504) {
        const noEnviado = err.statusText === NO_ENVIADO;
        const apiError: ApiError = {
          status: err.status,
          message: conexion.enLinea() ? MENSAJE_SIN_SERVIDOR : MENSAJE_SIN_INTERNET,
          ...(noEnviado ? { noEnviado } : {}),
        };
        logger.error(`[HTTP ${err.status}] ${req.method} ${req.url}`, apiError);
        return throwError(() => apiError);
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

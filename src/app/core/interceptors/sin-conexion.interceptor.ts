// JJ-Sprint5 27/11/2026: sin conexión, una acción que escribe (POST, PUT, PATCH, DELETE) no se intenta: no puede
// confirmarse sin el servidor. Se rechaza al instante con un mensaje claro, en todas las pantallas. Las lecturas
// (GET) sí pasan: el service worker las responde desde su caché.
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { ConexionService } from '@core/services/conexion.service';

export const MENSAJE_SIN_CONEXION =
  'Estás sin conexión. Esta acción necesita internet; inténtalo cuando vuelvas a conectarte.';

export const sinConexionInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || inject(ConexionService).enLinea()) return next(req);
  const error: ApiError = { status: 0, message: MENSAJE_SIN_CONEXION };
  return throwError(() => error);
};

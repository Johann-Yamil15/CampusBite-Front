import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { ConexionService } from '@core/services/conexion.service';

/** Marca del error que no llegó a salir del navegador (el errorInterceptor la pasa a `ApiError.noEnviado`). */
export const NO_ENVIADO = 'cb-no-enviado';

const SOLO_LECTURA = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CL-Sprint5 26/11/2026: sin internet no sale ningún POST/PUT/PATCH/DELETE: se corta aquí con status 0 y la
 * pantalla conserva su borrador. Así un pedido o un pago nunca se manda "a ciegas". Los GET sí pasan: el
 * service worker puede responder el menú desde su caché.
 * Va al final de la cadena, después del errorInterceptor, para que este normalice el error.
 */
export const sinConexionInterceptor: HttpInterceptorFn = (req, next) => {
  if (SOLO_LECTURA.has(req.method) || inject(ConexionService).enLinea()) return next(req);

  return throwError(
    () => new HttpErrorResponse({ status: 0, statusText: NO_ENVIADO, url: req.urlWithParams }),
  );
};

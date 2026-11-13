// CL-Sprint5 11/11/2026: backend simulado para los repositorios mock (data/mock de cada feature). Les da la
// misma forma que tiene un repositorio HTTP: Observable frío, con un poco de latencia, y los errores llegan
// como ApiError (status + mensaje en español), igual que los normaliza el errorInterceptor. Así las pantallas
// muestran sus estados de carga y de error de verdad, y cambiar mock → HTTP no les cambia nada.
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, defer, of, switchMap, throwError, timer } from 'rxjs';
import { ApiError } from '@core/http/api-error';

/** Milisegundos que tarda en "responder" el mock. Las pruebas lo ponen en 0 para responder en el acto. */
export const MOCK_LATENCIA_MS = new InjectionToken<number>('MOCK_LATENCIA_MS', {
  providedIn: 'root',
  factory: () => 350,
});

/** Error que lanza un mock para responder como lo haría el backend (ProblemDetails → ApiError). */
export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

@Injectable({ providedIn: 'root' })
export class MockBackend {
  private readonly latencia = inject(MOCK_LATENCIA_MS);

  /**
   * Ejecuta `accion` al suscribirse (como una petición) y emite su resultado. Si `accion` lanza un
   * MockHttpError, el Observable falla con un ApiError con ese status y mensaje.
   */
  responder<T>(accion: () => T): Observable<T> {
    const respuesta = defer(() => {
      try {
        return of(accion());
      } catch (e) {
        return throwError(() => aApiError(e));
      }
    });
    return this.latencia > 0
      ? timer(this.latencia).pipe(switchMap(() => respuesta))
      : respuesta;
  }
}

function aApiError(e: unknown): ApiError {
  if (e instanceof MockHttpError) return { status: e.status, message: e.message };
  return { status: 500, message: 'Ocurrió un error inesperado. Intenta de nuevo.' };
}

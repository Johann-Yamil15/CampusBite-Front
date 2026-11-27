import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/**
 * CL-Sprint5 26/11/2026: estado de la conexión a internet con los eventos `online`/`offline` del navegador.
 * `enLinea` es lo que dice el navegador: si es `false` seguro no hay red; si es `true` puede haber red sin que
 * el servidor responda (eso lo resuelve el errorInterceptor con status 0).
 */
@Injectable({ providedIn: 'root' })
export class ConexionService {
  private readonly _enLinea = signal(leerEstado());
  private readonly _reconectado = new Subject<void>();

  readonly enLinea = this._enLinea.asReadonly();
  /** Emite cada vez que se pasa de sin conexión a con conexión. */
  readonly reconectado$: Observable<void> = this._reconectado.asObservable();

  constructor() {
    if (typeof window === 'undefined') return;
    const alVolver = () => this.cambiar(true);
    const alPerder = () => this.cambiar(false);
    window.addEventListener('online', alVolver);
    window.addEventListener('offline', alPerder);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', alVolver);
      window.removeEventListener('offline', alPerder);
    });
  }

  private cambiar(enLinea: boolean): void {
    const antes = this._enLinea();
    this._enLinea.set(enLinea);
    if (enLinea && !antes) this._reconectado.next();
  }
}

function leerEstado(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

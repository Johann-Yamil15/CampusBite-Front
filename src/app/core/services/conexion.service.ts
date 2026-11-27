// JJ-Sprint5 27/11/2026: estado de la conexión a internet (PWA sin conexión). `enLinea()` cambia con los eventos
// online/offline del navegador; sin conexión, las lecturas salen del caché del service worker (ngsw-config.json).
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ConexionService {
  private readonly _enLinea = signal(navigator.onLine);
  readonly enLinea = this._enLinea.asReadonly();

  constructor() {
    const actualizar = () => this._enLinea.set(navigator.onLine);
    window.addEventListener('online', actualizar);
    window.addEventListener('offline', actualizar);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', actualizar);
      window.removeEventListener('offline', actualizar);
    });
  }
}

/** Nombre del grupo de datos de la API en ngsw-config.json: sus cachés se borran al cerrar sesión. */
export const CACHE_API = 'api-campusbite';

/** Borra lo que el service worker guardó de la API (pedidos, perfil…) para que no lo vea el siguiente usuario. */
export async function borrarCacheApi(): Promise<void> {
  if (typeof caches === 'undefined') return;
  const nombres = await caches.keys();
  await Promise.all(nombres.filter((n) => n.includes(CACHE_API)).map((n) => caches.delete(n)));
}

import { Injectable, signal } from '@angular/core';

/** CL-Sprint5 11/11/2026 (etapa 8): apariencia elegida en Perfil. "sistema" sigue al sistema operativo. */
export type PreferenciaTema = 'claro' | 'oscuro' | 'sistema';

/** Misma clave que lee el script de index.html para no parpadear al cargar. */
export const CLAVE_TEMA = 'cb.tema';

/**
 * CL-Sprint5 11/11/2026 (etapa 8): tema claro / oscuro / según el sistema, guardado en el navegador
 * (localStorage). Lo aplica con <html data-theme="light|dark">: los tokens (styles/_tokens.scss) ya saben
 * pintarse con eso; sin atributo siguen a prefers-color-scheme. Es una preferencia del dispositivo, no de la
 * cuenta, por eso no va al back.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly _preferencia = signal<PreferenciaTema>(leer());
  readonly preferencia = this._preferencia.asReadonly();

  constructor() {
    aplicar(this._preferencia());
  }

  elegir(preferencia: PreferenciaTema): void {
    this._preferencia.set(preferencia);
    aplicar(preferencia);
    try {
      if (preferencia === 'sistema') localStorage.removeItem(CLAVE_TEMA);
      else localStorage.setItem(CLAVE_TEMA, preferencia);
    } catch {
      // Storage bloqueado: el tema dura lo que dure la pestaña
    }
  }
}

function leer(): PreferenciaTema {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return t === 'claro' || t === 'oscuro' ? t : 'sistema';
  } catch {
    return 'sistema';
  }
}

function aplicar(preferencia: PreferenciaTema): void {
  const raiz = document.documentElement;
  if (preferencia === 'sistema') delete raiz.dataset['theme'];
  else raiz.dataset['theme'] = preferencia === 'oscuro' ? 'dark' : 'light';
}

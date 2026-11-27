import { Injectable, computed, inject } from '@angular/core';
import { TokenStorageService } from '@core/services/token-storage.service';
import { isJwtActive, readJwtClaim } from '@core/utils/jwt.util';

/** Prefijo de las claves: `cb.borrador.<sub del JWT>.<nombre>`. */
export const PREFIJO_BORRADOR = 'cb.borrador.';
/** Un borrador más viejo que esto ya no se recupera (precios, horarios y menú pudieron cambiar). */
export const VIGENCIA_BORRADOR_MS = 7 * 24 * 60 * 60 * 1000;
const VERSION = 1;

interface Sobre<T> {
  v: number;
  /** Cuándo se guardó (ms). */
  en: number;
  datos: T;
}

/**
 * CL-Sprint5 26/11/2026: borradores de formularios y del carrito en localStorage, para que sobrevivan a una
 * recarga sin internet. Son por usuario (el `sub` del token): otra cuenta en el mismo navegador no los ve.
 * Sin sesión no se guarda ni se lee nada. Todo acceso a localStorage va en try/catch (modo privado, cuota
 * llena): si falla, la app sigue igual, solo que sin borrador.
 *
 * Nunca guardar aquí contraseñas ni el código de recogida.
 */
@Injectable({ providedIn: 'root' })
export class BorradoresService {
  private readonly tokens = inject(TokenStorageService);

  /**
   * `sub` del usuario con sesión vigente; `null` sin sesión (mismo criterio que AuthFacade.isAuthenticated).
   * Si la sesión vence, los borradores se quedan guardados y vuelven cuando ese usuario inicia sesión otra vez.
   */
  readonly usuario = computed(() => {
    const token = this.tokens.token();
    return isJwtActive(token) ? readJwtClaim(token, 'sub') : null;
  });

  /**
   * Lee un borrador del usuario actual (o del indicado). Devuelve `null` si no hay, si venció, si es de otra
   * versión o si no pasa `esValido` (lo que hay en localStorage no es de fiar: lo pudo editar cualquiera).
   */
  leer<T>(nombre: string, esValido: (datos: unknown) => datos is T, usuario = this.usuario()): T | null {
    if (!usuario) return null;
    const clave = claveDe(usuario, nombre);
    try {
      const crudo = localStorage.getItem(clave);
      if (!crudo) return null;
      const sobre = JSON.parse(crudo) as Partial<Sobre<unknown>> | null;
      const vigente =
        sobre?.v === VERSION && typeof sobre.en === 'number' && Date.now() - sobre.en < VIGENCIA_BORRADOR_MS;
      if (vigente && esValido(sobre.datos)) return sobre.datos;
      localStorage.removeItem(clave);
    } catch {
      // JSON roto o storage bloqueado: como si no hubiera borrador
    }
    return null;
  }

  guardar<T>(nombre: string, datos: T, usuario = this.usuario()): void {
    if (!usuario) return;
    const sobre: Sobre<T> = { v: VERSION, en: Date.now(), datos };
    try {
      localStorage.setItem(claveDe(usuario, nombre), JSON.stringify(sobre));
    } catch {
      // Storage bloqueado o lleno: el borrador vive solo en memoria
    }
  }

  borrar(nombre: string, usuario = this.usuario()): void {
    if (!usuario) return;
    try {
      localStorage.removeItem(claveDe(usuario, nombre));
    } catch {
      // Storage bloqueado: no hay nada que borrar
    }
  }

  /** Borra todos los borradores del usuario actual. Solo al pulsar "Cerrar sesión". */
  borrarTodos(usuario = this.usuario()): void {
    if (!usuario) return;
    const prefijo = `${PREFIJO_BORRADOR}${usuario}.`;
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(prefijo))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Storage bloqueado: no hay nada que borrar
    }
  }
}

function claveDe(usuario: string, nombre: string): string {
  return `${PREFIJO_BORRADOR}${usuario}.${nombre}`;
}

/** Ayuda para los validadores de borradores: objeto plano (no arreglo ni null). */
export function esObjeto(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

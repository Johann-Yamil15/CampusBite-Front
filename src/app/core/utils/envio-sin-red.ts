import { Signal, inject, signal } from '@angular/core';
import { esErrorDeRed } from '@core/http/api-error';
import { ConexionService } from '@core/services/conexion.service';

/** Lo que se muestra cuando un envío no salió por falta de internet. */
export const MENSAJE_NO_ENVIADO =
  'Sin conexión: no se envió. Guardamos tus cambios; pulsa «Reintentar» cuando vuelva el internet.';

export interface EnvioSinRed {
  /** `true` con internet (según el navegador). */
  readonly enLinea: Signal<boolean>;
  /** Hubo un intento que no salió por la red: el botón dice «Reintentar». */
  readonly pendiente: Signal<boolean>;
  /** «Reintentar» espera a que vuelva el internet. */
  bloqueado(): boolean;
  /** Llamar al pulsar enviar. `false` = no enviar (no hay internet) y queda pendiente. */
  puedeEnviar(): boolean;
  /** En el `error` de la petición: `true` si fue de red (status 0) y queda pendiente. */
  falloDeRed(e: unknown): boolean;
  /** Tras enviar con éxito. */
  listo(): void;
}

/**
 * CL-Sprint5 26/11/2026: regla común de los formularios que envían algo: sin internet NO se envía, se conserva
 * el borrador y el botón pasa a «Reintentar», que se habilita al volver la conexión. Nunca reenvía solo:
 * el usuario confirma otra vez (un pedido o un pago reenviados a ciegas podrían duplicarse).
 * Se llama en un contexto de inyección.
 */
export function envioSinRed(): EnvioSinRed {
  const conexion = inject(ConexionService);
  const pendiente = signal(false);
  return {
    enLinea: conexion.enLinea,
    pendiente: pendiente.asReadonly(),
    bloqueado: () => pendiente() && !conexion.enLinea(),
    puedeEnviar: () => {
      if (conexion.enLinea()) return true;
      pendiente.set(true);
      return false;
    },
    falloDeRed: (e) => {
      if (!esErrorDeRed(e)) return false;
      pendiente.set(true);
      return true;
    },
    listo: () => pendiente.set(false),
  };
}

import { DestroyRef, inject } from '@angular/core';
import { ConexionService } from '@core/services/conexion.service';

/**
 * CL-Sprint5 26/11/2026: ejecuta `fn` cada vez que vuelve el internet, mientras viva quien lo llama (pantalla
 * o componente). Se llama en un contexto de inyección (constructor o inicializador de campo).
 */
export function alReconectar(fn: () => void): void {
  const sub = inject(ConexionService).reconectado$.subscribe(() => fn());
  inject(DestroyRef).onDestroy(() => sub.unsubscribe());
}

// JY-Sprint4 05/11/2026: avisos flotantes (toasts) para toda la app. Una pantalla solo llama a
// toast.ok('...') / toast.error('...'); dibujarlos y quitarlos es trabajo de ToastHostComponent.
import { Injectable, signal } from '@angular/core';

export type ToastKind = 'ok' | 'error' | 'info';

/** CL-Sprint5 11/11/2026 (etapa 7): botón opcional del aviso (p. ej. "Deshacer"). Al tocarlo se cierra. */
export interface AccionToast {
  etiqueta: string;
  ejecutar: () => void;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  accion?: AccionToast;
}

/** Cuánto se queda un aviso antes de irse solo. El mismo valor que ya usaba el panel de negocio. */
export const TOAST_MS = 5000;
/** Con un botón dura más, para alcanzar a tocarlo (WCAG 2.2.1). */
export const TOAST_ACCION_MS = 8000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private siguienteId = 1;
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();

  ok(text: string, accion?: AccionToast): void {
    this.show('ok', text, accion);
  }

  error(text: string, accion?: AccionToast): void {
    this.show('error', text, accion);
  }

  info(text: string, accion?: AccionToast): void {
    this.show('info', text, accion);
  }

  show(kind: ToastKind, text: string, accion?: AccionToast): void {
    const id = this.siguienteId++;
    this._toasts.update((lista) => [...lista, { id, kind, text, ...(accion ? { accion } : {}) }]);
    this.temporizadores.set(
      id,
      setTimeout(() => this.dismiss(id), accion ? TOAST_ACCION_MS : TOAST_MS),
    );
  }

  /** CL-Sprint5 11/11/2026 (etapa 7): ejecuta la acción del aviso y lo cierra. */
  accionar(id: number): void {
    const toast = this._toasts().find((t) => t.id === id);
    this.dismiss(id);
    toast?.accion?.ejecutar();
  }

  dismiss(id: number): void {
    // Se limpia el temporizador: cerrar a mano no debe dejar un timeout colgado
    const temporizador = this.temporizadores.get(id);
    if (temporizador !== undefined) {
      clearTimeout(temporizador);
      this.temporizadores.delete(id);
    }

    this._toasts.update((lista) => lista.filter((t) => t.id !== id));
  }
}

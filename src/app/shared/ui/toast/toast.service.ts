// JY-Sprint4 05/11/2026: avisos flotantes (toasts) para toda la app. Una pantalla solo llama a
// toast.ok('...') / toast.error('...'); dibujarlos y quitarlos es trabajo de ToastHostComponent.
import { Injectable, signal } from '@angular/core';

export type ToastKind = 'ok' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

/** Cuánto se queda un aviso antes de irse solo. El mismo valor que ya usaba el panel de negocio. */
export const TOAST_MS = 5000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private siguienteId = 1;
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();

  ok(text: string): void {
    this.show('ok', text);
  }

  error(text: string): void {
    this.show('error', text);
  }

  info(text: string): void {
    this.show('info', text);
  }

  show(kind: ToastKind, text: string): void {
    const id = this.siguienteId++;
    this._toasts.update((lista) => [...lista, { id, kind, text }]);
    this.temporizadores.set(
      id,
      setTimeout(() => this.dismiss(id), TOAST_MS),
    );
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

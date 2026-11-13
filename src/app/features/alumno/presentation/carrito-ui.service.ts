// CL-Sprint5 11/11/2026: estado de pantalla del carrito y del checkout (abiertos o cerrados). El drawer y el
// checkout viven en el layout del alumno; con esto la barra superior, la barra "Ver carrito" y cualquier
// pantalla los abren igual. Es estado de UI, no de negocio: por eso está en presentation y no en
// application (el contenido del carrito es CarritoStore).
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CarritoUiService {
  readonly abierto = signal(false);
  /** Etapa 5: el modal de checkout (hora de recogida, método de pago, notas). */
  readonly checkoutAbierto = signal(false);

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  /** Del carrito al checkout: se cierra uno y se abre el otro. */
  abrirCheckout(): void {
    this.abierto.set(false);
    this.checkoutAbierto.set(true);
  }

  cerrarCheckout(): void {
    this.checkoutAbierto.set(false);
  }
}

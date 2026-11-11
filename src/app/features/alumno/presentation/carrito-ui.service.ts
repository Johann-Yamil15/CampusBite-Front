// CL-Sprint5 11/11/2026: estado de pantalla del carrito (abierto o cerrado). El drawer vive en el layout del
// alumno; con esto la barra superior, la barra "Ver carrito" y cualquier pantalla lo abren igual. Es estado
// de UI, no de negocio: por eso está en presentation y no en application (el contenido es CarritoStore).
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CarritoUiService {
  readonly abierto = signal(false);

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }
}

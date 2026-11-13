import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { AuthFacade } from '@features/auth';
import { CarritoStore } from '@features/alumno';
import { ToastHostComponent } from '@shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, ToastHostComponent],
  // JY-Sprint4 05/11/2026: los avisos flotantes van fuera del outlet, para que sobrevivan al cambio de
  // pantalla (p. ej. "pedido cancelado" al volver de /pedidos/:id a /pedidos)
  // CL-Sprint5 11/11/2026: el carrito ya no se monta aquí (lo veían todos los roles, también el
  // encargado): vive en el layout del alumno, que además se carga en diferido.
  template: `<app-loader /><router-outlet /><app-toast-host />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthFacade);
  private readonly carrito = inject(CarritoStore);

  constructor() {
    // FB-Sprint4 01/11/2026: al cerrar sesión se vacía el carrito para que no pase al siguiente usuario.
    // Aquí y no en el layout: también cubre la sesión que vence (el interceptor la cierra en cualquier pantalla).
    effect(() => {
      if (!this.auth.isAuthenticated()) this.carrito.vaciar();
    });
  }
}

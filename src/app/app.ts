import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { AuthFacade } from '@features/auth';
import { CarritoService } from '@shared/carrito/carrito';
import { CarritoDrawerComponent } from './shared/carrito/carrito-drawer/carrito-drawer';
import { ToastHostComponent } from '@shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CarritoDrawerComponent, ToastHostComponent],
  // FB-Sprint4 01/11/2026: carrito global fuera del router-outlet para que persista al navegar (HU-07A)
  // JY-Sprint4 05/11/2026: los avisos flotantes también van fuera del outlet, para que sobrevivan al
  // cambio de pantalla (p. ej. "pedido cancelado" al volver de /pedidos/:folio a /pedidos)
  template: `<app-loader /><router-outlet />
    @if (auth.isAuthenticated()) {
      <app-carrito-drawer />
    }
    <app-toast-host />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(AuthFacade);
  private readonly carrito = inject(CarritoService);

  constructor() {
    // FB-Sprint4 01/11/2026: al cerrar sesión se vacía el carrito para que no pase al siguiente usuario
    effect(() => {
      if (!this.auth.isAuthenticated()) this.carrito.vaciar();
    });
  }
}

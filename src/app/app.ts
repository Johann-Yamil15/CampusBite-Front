import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { AuthFacade } from '@features/auth';
import { CarritoService } from './services/carrito';
import { CarritoDrawerComponent } from './shared/carrito/carrito-drawer/carrito-drawer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CarritoDrawerComponent],
  // FB-Sprint4 01/11/2026: carrito global fuera del router-outlet para que persista al navegar (HU-07A)
  template: `<app-loader /><router-outlet />
    @if (auth.isAuthenticated()) {
      <app-carrito-drawer />
    }`,
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

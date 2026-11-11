import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { AuthFacade } from '@features/auth';
import { CarritoDrawerComponent } from '@features/alumno';
import { ToastHostComponent } from '@shared/ui/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, CarritoDrawerComponent, ToastHostComponent],
  // FB-Sprint4 01/11/2026: carrito global fuera del router-outlet para que persista al navegar (HU-07A)
  // JY-Sprint4 05/11/2026: los avisos flotantes también van fuera del outlet, para que sobrevivan al
  // cambio de pantalla (p. ej. "pedido cancelado" al volver de /pedidos/:id a /pedidos)
  // CL-Sprint5 11/11/2026: el carrito se carga con @defer: así él y Angular Material salen del bundle
  // inicial (estaba a 1 kB del límite de 800 kB). Aparece en cuanto el navegador queda libre. Vaciarlo al
  // cerrar sesión ahora lo hace el propio drawer al destruirse (este @if lo quita al salir).
  template: `<app-loader /><router-outlet />
    @if (auth.isAuthenticated()) {
      @defer (on idle) {
        <app-carrito-drawer />
      }
    }
    <app-toast-host />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly auth = inject(AuthFacade);
}

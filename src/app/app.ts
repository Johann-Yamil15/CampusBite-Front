import { ChangeDetectionStrategy, Component, effect, inject, untracked } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent } from '@shared/ui/loader/loader.component';
import { AuthFacade } from '@features/auth';
import { CarritoStore } from '@features/alumno';
import { ToastHostComponent } from '@shared/ui/toast/toast.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { SinConexionComponent } from '@shared/ui/sin-conexion/sin-conexion.component';
import { ConexionService, borrarCacheApi } from '@core/services/conexion.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoaderComponent, ToastHostComponent, SinConexionComponent],
  // JY-Sprint4 05/11/2026: los avisos flotantes van fuera del outlet, para que sobrevivan al cambio de
  // pantalla (p. ej. "pedido cancelado" al volver de /pedidos/:id a /pedidos)
  // CL-Sprint5 11/11/2026: el carrito ya no se monta aquí (lo veían todos los roles, también el
  // encargado): vive en el layout del alumno, que además se carga en diferido.
  // JJ-Sprint5 27/11/2026: franja de "sin conexión" para la PWA
  template: `<app-loader /><router-outlet /><app-toast-host /><app-sin-conexion />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly auth = inject(AuthFacade);
  private readonly carrito = inject(CarritoStore);
  private readonly conexion = inject(ConexionService);
  private readonly toast = inject(ToastService);

  constructor() {
    // FB-Sprint4 01/11/2026: al cerrar sesión se vacía el carrito para que no pase al siguiente usuario.
    // Aquí y no en el layout: también cubre la sesión que vence (el interceptor la cierra en cualquier pantalla).
    // JJ-Sprint5 27/11/2026: y se borra lo que el service worker guardó de la API (pedidos, perfil…)
    effect(() => {
      if (!this.auth.isAuthenticated()) {
        untracked(() => this.carrito.vaciar());
        void borrarCacheApi();
      }
    });

    // JJ-Sprint5 27/11/2026: avisa cuando vuelve la conexión (no al abrir la app con internet)
    let estabaDesconectado = !this.conexion.enLinea();
    effect(() => {
      const enLinea = this.conexion.enLinea();
      if (enLinea && estabaDesconectado) untracked(() => this.toast.ok('Conexión restablecida.'));
      estabaDesconectado = !enLinea;
    });
  }
}

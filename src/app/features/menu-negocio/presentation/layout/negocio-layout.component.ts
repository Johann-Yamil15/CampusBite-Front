// JY-Sprint4 05/11/2026: chrome común de las secciones nuevas del Panel de Negocio (Pedidos, Promociones,
// Estadísticas, Horario): reusa el sidebar de CL y pone un <router-outlet> para cada pantalla.
// shortcut: el panel de Inicio (panel-negocio.page) trae su propio chrome y no pasa por aquí; se unifica
// cuando esa página se parta en secciones y deje de ser una sola pantalla.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { AuthFacade } from '@features/auth';
import { CafeteriaFacade } from '@features/cafeterias';
import { PedidosCafeteriaFacade, etapa } from '@features/ordenes';
import { ToastService } from '@shared/ui/toast/toast.service';
import { NegocioNavComponent } from '@features/menu-negocio/presentation/components/negocio-nav/negocio-nav.component';

/** Cada cuánto se revisa si llegaron pedidos nuevos. */
export const REVISAR_PEDIDOS_MS = 10_000;

@Component({
  selector: 'app-negocio-layout',
  imports: [RouterOutlet, NegocioNavComponent],
  templateUrl: './negocio-layout.component.html',
  styleUrl: './negocio-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NegocioLayoutComponent implements OnInit {
  /** Id de la cafetería del encargado; lo resuelve `/mi-negocio` y las subrutas lo heredan. */
  readonly id = input<string>('');

  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cafeterias = inject(CafeteriaFacade);
  private readonly pedidos = inject(PedidosCafeteriaFacade);
  private readonly toast = inject(ToastService);

  /** CL-Sprint5 11/11/2026 (etapa 9): insignia de "Pedidos" en el menú. */
  protected readonly pedidosNuevos = computed(
    () => this.pedidos.ordenes().filter((o) => etapa(o.estado) === 'recibido').length,
  );

  constructor() {
    // CL-Sprint5 11/11/2026 (etapa 9): en cualquier sección del negocio se revisa cada 10 s si llegaron
    // pedidos (mismos datos que ve el alumno) y se avisa con un toast que lleva al tablero.
    const reloj = setInterval(() => this.revisarPedidos(), REVISAR_PEDIDOS_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));

    effect(() => {
      const llegaron = this.pedidos.llegaron();
      if (!llegaron.length) return;
      untracked(() => {
        const [primero] = llegaron;
        this.toast.info(
          llegaron.length === 1
            ? `Llegó un pedido nuevo: ${primero.folio}${primero.alumno ? ' de ' + primero.alumno.nombre : ''}.`
            : `Llegaron ${llegaron.length} pedidos nuevos.`,
          { etiqueta: 'Ver', ejecutar: () => void this.router.navigate(['/mi-negocio/pedidos']) },
        );
      });
    });
  }

  ngOnInit(): void {
    this.revisarPedidos();
    const id = this.id();
    if (!id || this.cafeterias.selected()?.id === id) return;

    // Solo para el nombre del negocio en el sidebar: si falla, la tarjeta dice "Mi negocio"
    this.cafeterias
      .loadById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  /** Sin parpadeo ni errores a la vista: si falla, se intenta en la siguiente vuelta. */
  private revisarPedidos(): void {
    const id = this.id();
    if (id && document.visibilityState === 'visible') {
      this.pedidos.refrescar(id).subscribe({ error: () => undefined });
    }
  }

  protected logout(): void {
    this.auth.logout();
  }

  /** "Menú" del sidebar: la galería de platillos vive en el panel de Inicio. */
  protected goToMenu(): void {
    void this.router.navigate(['/mi-negocio']);
  }
}

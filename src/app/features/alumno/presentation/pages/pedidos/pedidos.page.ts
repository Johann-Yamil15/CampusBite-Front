// JY-Sprint4 05/11/2026: HU-08 (cascarón visual). Mis pedidos: pestañas En curso / Historial, paginado y
// tarjeta por pedido con su estado.
// CL-Sprint5 11/11/2026: los pedidos salen de MisPedidosFacade (feature ordenes) con los estados reales de
// la BD; al alumno se le muestran como etapas (pendiente y confirmada = "Recibido").
// CL-Sprint5 11/11/2026 (etapa 6): rediseño. Pestañas Activos / Historial (también en la URL: ?ver=historial),
// tarjetas app-pedido-card, esqueletos mientras carga, vacío con "Explorar cafeterías", error con
// "Reintentar" y refresco en vivo cada 15 s mientras haya pedidos activos (sin parpadeo).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { MisPedidosFacade, Orden } from '@features/ordenes';
import { PedidoCardComponent } from '@features/alumno/presentation/components/pedido-card/pedido-card.component';

export type Pestana = 'activos' | 'historial';

const POR_PAGINA = 6;
/** Cada cuánto se revisa si cambió el estado de los pedidos activos. */
export const REFRESCO_LISTA_MS = 15_000;

@Component({
  selector: 'app-pedidos-page',
  imports: [RouterLink, PaginadorComponent, IconComponent, PedidoCardComponent],
  templateUrl: './pedidos.page.html',
  styleUrl: './pedidos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosPage {
  /** ?ver=historial (con withComponentInputBinding; si no viene llega `undefined`). */
  readonly ver = input<string | undefined>();

  private readonly pedidos = inject(MisPedidosFacade);
  private readonly router = inject(Router);

  protected readonly porPagina = POR_PAGINA;
  protected readonly esqueletos = [0, 1, 2];

  protected readonly pestana = computed<Pestana>(() => (this.ver() === 'historial' ? 'historial' : 'activos'));
  protected readonly pagina = signal(1);

  protected readonly activos = this.pedidos.enCurso;
  protected readonly historial = this.pedidos.historial;
  protected readonly cargando = this.pedidos.cargando;
  protected readonly error = this.pedidos.error;
  /** Ya respondió al menos una vez (para no mostrar "vacío" antes de saber). */
  private readonly cargado = signal(false);

  protected readonly sinPedidos = computed(() => this.cargado() && !this.pedidos.ordenes().length);
  protected readonly todos = computed<Orden[]>(() =>
    this.pestana() === 'activos' ? this.activos() : this.historial(),
  );
  protected readonly visibles = computed(() => pagina(this.todos(), this.pagina(), POR_PAGINA));

  constructor() {
    this.cargar();

    // Al cambiar de pestaña se vuelve a la página 1; si se acorta la lista, la página se ajusta
    effect(() => {
      this.pestana();
      untracked(() => this.pagina.set(1));
    });
    effect(() => {
      const paginas = Math.max(Math.ceil(this.todos().length / POR_PAGINA), 1);
      if (untracked(this.pagina) > paginas) this.pagina.set(paginas);
    });

    // En vivo: solo mientras haya pedidos activos y la pestaña del navegador esté a la vista
    const reloj = setInterval(() => {
      if (this.activos().length && document.visibilityState === 'visible') {
        this.pedidos.refrescar().subscribe({ error: () => undefined });
      }
    }, REFRESCO_LISTA_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(reloj));
  }

  protected cargar(): void {
    this.pedidos.cargar(true).subscribe({
      next: () => this.cargado.set(true),
      error: () => undefined,
    });
  }

  protected verPestana(pestana: Pestana): void {
    void this.router.navigate([], {
      queryParams: { ver: pestana === 'historial' ? 'historial' : null },
      replaceUrl: true,
    });
  }

  /** Flechas izquierda/derecha entre pestañas (patrón tablist de WAI-ARIA). */
  protected teclaPestana(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const otra: Pestana = this.pestana() === 'activos' ? 'historial' : 'activos';
    this.verPestana(otra);
    const lista = (event.currentTarget as HTMLElement).closest('[role="tablist"]');
    lista?.querySelector<HTMLElement>(`#tab-${otra}`)?.focus();
  }
}

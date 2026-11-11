// JY-Sprint4 05/11/2026: HU-08 (cascarón visual). Mis pedidos: pestañas En curso / Historial, paginado y
// tarjeta por pedido con su estado. Los datos salen de PedidosAlumnoStore (en memoria, ver pedidos.mock.ts).
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ETIQUETA_ESTADO, Pedido, total } from '@features/alumno/presentation/pedidos.mock';
import { PedidosAlumnoStore } from '@features/alumno/presentation/pedidos.store';

type Pestana = 'curso' | 'historial';

const POR_PAGINA = 5;

@Component({
  selector: 'app-pedidos-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, PaginadorComponent],
  templateUrl: './pedidos.page.html',
  styleUrl: './pedidos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosPage {
  private readonly store = inject(PedidosAlumnoStore);

  protected readonly etiqueta = ETIQUETA_ESTADO;
  protected readonly total = total;
  protected readonly porPagina = POR_PAGINA;

  protected readonly pestana = signal<Pestana>('curso');
  protected readonly pagina = signal(1);

  protected readonly enCurso = this.store.enCurso;
  protected readonly historial = this.store.historial;

  protected readonly todos = computed<Pedido[]>(() =>
    this.pestana() === 'curso' ? this.enCurso() : this.historial(),
  );

  protected readonly visibles = computed(() => pagina(this.todos(), this.pagina(), POR_PAGINA));

  constructor() {
    // Al cambiar de pestaña (o si se cancela un pedido) la página actual puede quedar fuera de rango
    effect(() => {
      const paginas = Math.max(Math.ceil(this.todos().length / POR_PAGINA), 1);
      if (this.pagina() > paginas) this.pagina.set(paginas);
    });
  }

  protected verPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.pagina.set(1);
  }

  protected resumen(pedido: Pedido): string {
    const piezas = pedido.items.reduce((suma, item) => suma + item.cantidad, 0);
    const extra = pedido.items.length > 1 ? ' y más' : '';
    return `${piezas} ${piezas === 1 ? 'artículo' : 'artículos'} · ${pedido.items[0].producto}${extra}`;
  }
}

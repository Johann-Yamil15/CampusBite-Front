// JY-Sprint4 05/11/2026: HU-08 (cascarón visual). Mis pedidos: pestañas En curso / Historial, paginado y
// tarjeta por pedido con su estado.
// CL-Sprint5 11/11/2026: los pedidos salen de MisPedidosFacade (feature ordenes) con los estados reales de
// la BD; al alumno se le muestran como etapas (pendiente y confirmada = "Recibido").
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ETIQUETA_ETAPA, MisPedidosFacade, Orden, etapa } from '@features/ordenes';

type Pestana = 'curso' | 'historial';

const POR_PAGINA = 5;

@Component({
  selector: 'app-pedidos-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, PaginadorComponent],
  templateUrl: './pedidos.page.html',
  styleUrl: './pedidos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosPage implements OnInit {
  private readonly pedidos = inject(MisPedidosFacade);

  protected readonly etiqueta = ETIQUETA_ETAPA;
  protected readonly etapa = etapa;
  protected readonly porPagina = POR_PAGINA;
  protected readonly sinImagen = 'assets/images/producto-sin-imagen.svg';

  protected readonly pestana = signal<Pestana>('curso');
  protected readonly pagina = signal(1);

  protected readonly enCurso = this.pedidos.enCurso;
  protected readonly historial = this.pedidos.historial;
  protected readonly cargando = this.pedidos.cargando;
  protected readonly error = this.pedidos.error;

  protected readonly todos = computed<Orden[]>(() =>
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

  ngOnInit(): void {
    // Siempre fresco al entrar: el estado de un pedido cambia mientras el alumno espera
    this.cargar();
  }

  protected cargar(): void {
    this.pedidos.cargar(true).subscribe({ error: () => undefined });
  }

  protected verPestana(pestana: Pestana): void {
    this.pestana.set(pestana);
    this.pagina.set(1);
  }

  protected resumen(pedido: Orden): string {
    const piezas = pedido.lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
    const extra = pedido.lineas.length > 1 ? ' y más' : '';
    return `${piezas} ${piezas === 1 ? 'artículo' : 'artículos'} · ${pedido.lineas[0]?.producto ?? ''}${extra}`;
  }
}

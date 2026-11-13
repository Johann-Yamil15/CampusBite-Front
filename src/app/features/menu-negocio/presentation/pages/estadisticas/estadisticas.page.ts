// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Estadísticas del negocio: ventas de la semana, top de
// platillos y horas pico.
// CL-Sprint5 11/11/2026 (etapa 9): ya no son cifras fijas: se calculan (estadisticas.model.ts) con los
// pedidos del tablero (PedidosCafeteriaFacade, los mismos datos simulados que ve el alumno), por periodo:
// hoy, últimos 7 o 30 días. Ventas, pedidos, ticket, pedidos por estado, ventas por día, más vendidos y
// horas pico. Carga con esqueleto, error con "Reintentar" y vacío si el periodo no tiene pedidos.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PedidosCafeteriaFacade } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import {
  ETIQUETA_GRUPO,
  ETIQUETA_PERIODO,
  GRUPOS_ESTADO,
  PERIODOS,
  Periodo,
  estadisticas,
} from '@features/menu-negocio/domain/models/estadisticas.model';

@Component({
  selector: 'app-estadisticas-page',
  imports: [CurrencyPipe, IconComponent],
  templateUrl: './estadisticas.page.html',
  styleUrl: './estadisticas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticasPage {
  private readonly pedidos = inject(PedidosCafeteriaFacade);
  private readonly route = inject(ActivatedRoute);

  protected readonly periodos = PERIODOS;
  protected readonly etiquetaPeriodo = ETIQUETA_PERIODO;
  protected readonly grupos = GRUPOS_ESTADO;
  protected readonly etiquetaGrupo = ETIQUETA_GRUPO;

  protected readonly cargando = this.pedidos.cargando;
  protected readonly error = this.pedidos.error;
  protected readonly cargado = signal(false);
  protected readonly periodo = signal<Periodo>('7d');

  private readonly idCafeteria: string =
    this.route.snapshot.pathFromRoot.map((r) => r.data['id'] as string | undefined).find(Boolean) ??
    '';

  protected readonly datos = computed(() => estadisticas(this.pedidos.ordenes(), this.periodo(), new Date()));
  protected readonly sinDatos = computed(() => {
    const d = this.datos();
    return d.pedidos === 0 && d.cancelados === 0;
  });

  private readonly maxDia = computed(() => Math.max(...this.datos().ventasPorDia.map((b) => b.valor), 1));
  private readonly maxHora = computed(() => Math.max(...this.datos().horasPico.map((b) => b.valor), 1));
  private readonly maxTop = computed(() => Math.max(...this.datos().masVendidos.map((t) => t.piezas), 1));
  /** La hora con más pedidos (para el texto bajo la gráfica). */
  protected readonly horaMasFuerte = computed(() =>
    this.datos().horasPico.reduce<{ etiqueta: string; valor: number } | null>(
      (mejor, h) => (!mejor || h.valor > mejor.valor ? h : mejor),
      null,
    ),
  );

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.pedidos.cargar(this.idCafeteria).subscribe({
      next: () => this.cargado.set(true),
      error: () => undefined,
    });
  }

  /** Alto de la barra en %; los días sin ventas dejan una marca mínima para verse en el eje. */
  protected altoDia(valor: number): string {
    return valor ? `${Math.max((valor / this.maxDia()) * 100, 6)}%` : '2px';
  }

  protected anchoHora(valor: number): string {
    return `${(valor / this.maxHora()) * 100}%`;
  }

  protected anchoTop(piezas: number): string {
    return `${(piezas / this.maxTop()) * 100}%`;
  }
}

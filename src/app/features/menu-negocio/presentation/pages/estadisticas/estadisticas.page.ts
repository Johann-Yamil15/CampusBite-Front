// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Estadísticas del negocio: ventas de la semana, top de
// platillos y horas pico. Las cifras son fijas; el cambio de periodo solo cambia el texto del encabezado.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';

interface DiaVenta {
  dia: string;
  monto: number;
  pedidos: number;
}

interface TopPlatillo {
  producto: string;
  vendidos: number;
  monto: number;
}

interface HoraPico {
  hora: string;
  pedidos: number;
}

const SEMANA: DiaVenta[] = [
  { dia: 'Lun', monto: 1840, pedidos: 31 },
  { dia: 'Mar', monto: 2260, pedidos: 38 },
  { dia: 'Mié', monto: 1620, pedidos: 27 },
  { dia: 'Jue', monto: 2980, pedidos: 46 },
  { dia: 'Vie', monto: 3410, pedidos: 52 },
  { dia: 'Sáb', monto: 980, pedidos: 14 },
  { dia: 'Dom', monto: 0, pedidos: 0 },
];

const TOP: TopPlatillo[] = [
  { producto: 'Chilaquiles Verdes', vendidos: 64, monto: 3712 },
  { producto: 'Latte Helado', vendidos: 58, monto: 2204 },
  { producto: 'Sándwich Clásico de Pollo', vendidos: 41, monto: 2255 },
  { producto: 'Molletes de Frijol', vendidos: 33, monto: 1386 },
  { producto: 'Café Americano', vendidos: 29, monto: 812 },
];

const HORAS: HoraPico[] = [
  { hora: '08:00', pedidos: 18 },
  { hora: '10:00', pedidos: 34 },
  { hora: '12:00', pedidos: 52 },
  { hora: '14:00', pedidos: 41 },
  { hora: '16:00', pedidos: 15 },
  { hora: '18:00', pedidos: 6 },
];

type Periodo = 'semana' | 'mes';

@Component({
  selector: 'app-estadisticas-page',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './estadisticas.page.html',
  styleUrl: './estadisticas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticasPage {
  protected readonly semana = SEMANA;
  protected readonly top = TOP;
  protected readonly horas = HORAS;

  protected readonly periodo = signal<Periodo>('semana');

  protected readonly etiquetaPeriodo = computed(() =>
    this.periodo() === 'semana' ? 'Esta semana' : 'Este mes',
  );

  /** El mes se simula multiplicando la semana; con datos reales esto viene del back. */
  private readonly factor = computed(() => (this.periodo() === 'semana' ? 1 : 4.3));

  protected readonly ventas = computed(
    () => SEMANA.reduce((suma, d) => suma + d.monto, 0) * this.factor(),
  );

  protected readonly pedidos = computed(() =>
    Math.round(SEMANA.reduce((suma, d) => suma + d.pedidos, 0) * this.factor()),
  );

  protected readonly ticket = computed(() =>
    this.pedidos() ? this.ventas() / this.pedidos() : 0,
  );

  private readonly maxMonto = Math.max(...SEMANA.map((d) => d.monto));
  private readonly maxHora = Math.max(...HORAS.map((h) => h.pedidos));
  private readonly maxTop = Math.max(...TOP.map((t) => t.vendidos));

  /** Alto de cada barra en porcentaje; el 4% mínimo deja ver los días en cero. */
  protected altoBarra(monto: number): string {
    return `${Math.max((monto / this.maxMonto) * 100, 4)}%`;
  }

  protected anchoHora(pedidos: number): string {
    return `${(pedidos / this.maxHora) * 100}%`;
  }

  protected anchoTop(vendidos: number): string {
    return `${(vendidos / this.maxTop) * 100}%`;
  }
}

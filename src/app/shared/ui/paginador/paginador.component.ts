// JY-Sprint4 05/11/2026: paginado reutilizable. Solo dice en qué página está y a cuál ir; cortar la lista
// es trabajo de quien lo usa (una pantalla con datos del back pedirá esa página al API en su lugar).
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.component.html',
  styleUrl: './paginador.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginadorComponent {
  /** Cuántos elementos hay en total (no los de esta página). */
  readonly total = input.required<number>();
  readonly porPagina = input(6);
  /** Página actual, empezando en 1. Es un model: el padre la lee y la escribe. */
  readonly pagina = model(1);
  /** Para el texto "Mostrando X–Y de Z artículos". */
  readonly etiqueta = input('elementos');

  readonly paginas = computed(() => Math.max(Math.ceil(this.total() / this.porPagina()), 1));

  readonly desde = computed(() => (this.total() ? (this.pagina() - 1) * this.porPagina() + 1 : 0));

  readonly hasta = computed(() => Math.min(this.pagina() * this.porPagina(), this.total()));

  /** Números de página a mostrar: todas si son pocas, o una ventana alrededor de la actual. */
  readonly numeros = computed(() => {
    const paginas = this.paginas();
    if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1);

    const actual = this.pagina();
    const inicio = Math.max(Math.min(actual - 2, paginas - 4), 1);
    return Array.from({ length: 5 }, (_, i) => inicio + i);
  });

  ir(pagina: number): void {
    this.pagina.set(Math.min(Math.max(pagina, 1), this.paginas()));
  }
}

/** Corta una lista a la página pedida. Lo usan las pantallas de cascarón que paginan en memoria. */
export function pagina<T>(items: readonly T[], pagina: number, porPagina: number): T[] {
  return items.slice((pagina - 1) * porPagina, pagina * porPagina);
}

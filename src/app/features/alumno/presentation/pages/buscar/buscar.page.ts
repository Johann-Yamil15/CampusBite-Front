// JY-Sprint4 05/11/2026: HU-06 (cascarón visual). Buscar platillos: texto, categoría y cafetería filtran
// sobre un catálogo fijo (ver catalogo.mock.ts) porque el back todavía no tiene búsqueda.
// Lo que SÍ es real: el modal de producto agrega al carrito con CarritoService (estado local, sin back),
// incluido el aviso cuando ya hay productos de otra cafetería.
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { CarritoService } from '@shared/carrito/carrito';
import {
  CAFETERIAS,
  CATALOGO,
  CATEGORIAS,
  PlatilloCatalogo,
} from '@features/alumno/presentation/catalogo.mock';

const POR_PAGINA = 8;

@Component({
  selector: 'app-buscar-page',
  imports: [CurrencyPipe, RouterLink, ModalComponent, PaginadorComponent],
  templateUrl: './buscar.page.html',
  styleUrl: './buscar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscarPage {
  /** Texto que llega de la topbar (/buscar?q=…). */
  readonly q = input<string>('');

  private readonly carritoService = inject(CarritoService);
  private readonly toast = inject(ToastService);

  protected readonly categorias = CATEGORIAS;
  protected readonly cafeterias = CAFETERIAS;
  protected readonly porPagina = POR_PAGINA;

  protected readonly texto = signal('');
  protected readonly categoria = signal<string>('Todos');
  protected readonly cafeteria = signal<string>('Todas');
  protected readonly pagina = signal(1);

  protected readonly resultados = computed<PlatilloCatalogo[]>(() => {
    const texto = this.texto().trim().toLowerCase();
    const categoria = this.categoria();
    const cafeteria = this.cafeteria();

    return CATALOGO.filter((p) => {
      const coincideTexto =
        !texto ||
        p.producto.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoria === 'Todos' || p.categoria === categoria;
      const coincideCafeteria = cafeteria === 'Todas' || p.cafeteria === cafeteria;
      return coincideTexto && coincideCategoria && coincideCafeteria;
    });
  });

  protected readonly visibles = computed(() =>
    pagina(this.resultados(), this.pagina(), POR_PAGINA),
  );

  protected readonly hayFiltros = computed(
    () => !!this.texto().trim() || this.categoria() !== 'Todos' || this.cafeteria() !== 'Todas',
  );

  constructor() {
    // El texto de la topbar entra como filtro inicial
    effect(() => {
      const q = this.q();
      if (q) this.texto.set(q);
    });

    // Al filtrar, la página actual puede quedar fuera de rango
    effect(() => {
      const paginas = Math.max(Math.ceil(this.resultados().length / POR_PAGINA), 1);
      if (this.pagina() > paginas) this.pagina.set(paginas);
    });
  }

  // ---------- Modal de producto ----------
  protected readonly elegido = signal<PlatilloCatalogo | null>(null);
  protected readonly cantidad = signal(1);
  protected readonly notas = signal('');
  protected readonly error = signal<string | null>(null);

  protected readonly subtotal = computed(() => (this.elegido()?.precio ?? 0) * this.cantidad());

  protected onTexto(event: Event): void {
    this.texto.set((event.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  protected onNotas(event: Event): void {
    this.notas.set((event.target as HTMLTextAreaElement).value);
  }

  protected onCafeteria(event: Event): void {
    this.cafeteria.set((event.target as HTMLSelectElement).value);
    this.pagina.set(1);
  }

  protected verCategoria(categoria: string): void {
    this.categoria.set(categoria);
    this.pagina.set(1);
  }

  protected limpiar(): void {
    this.texto.set('');
    this.categoria.set('Todos');
    this.cafeteria.set('Todas');
    this.pagina.set(1);
  }

  protected abrir(platillo: PlatilloCatalogo): void {
    this.elegido.set(platillo);
    this.cantidad.set(1);
    this.notas.set('');
    this.error.set(null);
  }

  protected cerrar(): void {
    this.elegido.set(null);
  }

  /** Tope de 20 por producto, el mismo que aplica CarritoService. */
  protected cambiarCantidad(delta: number): void {
    this.cantidad.update((c) => Math.min(Math.max(c + delta, 1), 20));
  }

  protected agregar(): void {
    const platillo = this.elegido();
    if (!platillo) return;

    try {
      this.carritoService.agregar({
        idProducto: platillo.idProducto,
        producto: platillo.producto,
        precio: platillo.precio,
        cantidad: this.cantidad(),
        imagenUrl: platillo.foto,
        idCafeteria: platillo.idCafeteria,
        cafeteria: platillo.cafeteria,
      });
      this.toast.ok(`${platillo.producto} se agregó a tu carrito.`);
      this.cerrar();
    } catch (e) {
      // CarritoService no deja mezclar cafeterías: se muestra el motivo dentro del modal
      this.error.set(e instanceof Error ? e.message : 'No se pudo agregar al carrito.');
    }
  }

  /** Vacía el carrito y agrega este platillo: la salida del aviso de "otra cafetería". */
  protected vaciarYAgregar(): void {
    this.carritoService.vaciar();
    this.error.set(null);
    this.agregar();
  }
}

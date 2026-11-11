// JY-Sprint4 05/11/2026: HU-06 (cascarón visual). Buscar platillos: texto, categoría y cafetería filtran
// sobre el catálogo. El modal de producto agrega al carrito (estado local), incluido el aviso cuando ya hay
// productos de otra cafetería.
// CL-Sprint5 11/11/2026: el catálogo sale de CatalogoFacade (feature catalogo, hoy con repositorio mock);
// las categorías y cafeterías de los filtros se derivan del menú en vez de listas fijas.
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
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
import { CatalogoFacade, PlatilloCatalogo } from '@features/catalogo';
import { CarritoStore } from '@features/alumno/application/carrito.store';

const POR_PAGINA = 8;

@Component({
  selector: 'app-buscar-page',
  imports: [CurrencyPipe, RouterLink, ModalComponent, PaginadorComponent],
  templateUrl: './buscar.page.html',
  styleUrl: './buscar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscarPage implements OnInit {
  /** Texto que llega de la topbar (/buscar?q=…). */
  readonly q = input<string>('');
  /** CL-Sprint5 11/11/2026: categoría que llega del inicio (/buscar?categoria=Desayunos). */
  readonly categoria = input<string>('');

  private readonly carritoService = inject(CarritoStore);
  private readonly toast = inject(ToastService);
  private readonly catalogo = inject(CatalogoFacade);

  protected readonly categorias = computed(() => ['Todos', ...this.catalogo.categorias()]);
  protected readonly cafeterias = computed(() => [
    'Todas',
    ...this.catalogo.menu().map((c) => c.cafeteria),
  ]);
  protected readonly porPagina = POR_PAGINA;
  protected readonly sinImagen = 'assets/images/producto-sin-imagen.svg';
  protected readonly cargando = this.catalogo.cargando;
  protected readonly errorCarga = this.catalogo.error;

  protected readonly texto = signal('');
  protected readonly categoriaSel = signal<string>('Todos');
  protected readonly cafeteria = signal<string>('Todas');
  protected readonly pagina = signal(1);

  protected readonly resultados = computed<PlatilloCatalogo[]>(() => {
    const texto = this.texto().trim().toLowerCase();
    const categoria = this.categoriaSel();
    const cafeteria = this.cafeteria();

    return this.catalogo.platillos().filter((p) => {
      const coincideTexto =
        !texto ||
        p.producto.toLowerCase().includes(texto) ||
        !!p.descripcion?.toLowerCase().includes(texto);
      const coincideCategoria = categoria === 'Todos' || p.categoria === categoria;
      const coincideCafeteria = cafeteria === 'Todas' || p.cafeteria === cafeteria;
      return coincideTexto && coincideCategoria && coincideCafeteria;
    });
  });

  protected readonly visibles = computed(() =>
    pagina(this.resultados(), this.pagina(), POR_PAGINA),
  );

  protected readonly hayFiltros = computed(
    () => !!this.texto().trim() || this.categoriaSel() !== 'Todos' || this.cafeteria() !== 'Todas',
  );

  constructor() {
    // El texto de la topbar entra como filtro inicial
    effect(() => {
      const q = this.q();
      if (q) this.texto.set(q);
    });

    // La categoría del inicio (o de una promoción) entra como filtro inicial
    effect(() => {
      const categoria = this.categoria();
      if (categoria) this.categoriaSel.set(categoria);
    });

    // Al filtrar, la página actual puede quedar fuera de rango
    effect(() => {
      const paginas = Math.max(Math.ceil(this.resultados().length / POR_PAGINA), 1);
      if (this.pagina() > paginas) this.pagina.set(paginas);
    });
  }

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  protected cargarCatalogo(forzar = false): void {
    this.catalogo.cargar(forzar).subscribe({ error: () => undefined });
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
    this.categoriaSel.set(categoria);
    this.pagina.set(1);
  }

  protected limpiar(): void {
    this.texto.set('');
    this.categoriaSel.set('Todos');
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
        imagenUrl: platillo.imagenUrl,
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

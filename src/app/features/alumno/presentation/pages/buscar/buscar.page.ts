// JY-Sprint4 05/11/2026: HU-06 (cascarón visual). Buscar platillos por texto, categoría y cafetería.
// CL-Sprint5 11/11/2026: etapa 4 del rediseño. Búsqueda en vivo (nombre, ingredientes o cafetería, sin
// importar acentos), filtros de precio, tiempo, calificación, dieta, cafetería y "solo abiertas", orden y
// paginado. Las reglas viven en buscarPlatillos (dominio del catálogo); aquí solo se arma la pantalla.
// Los criterios se reflejan en la URL (/buscar?q=…&categoria=…&precio=…) para poder compartir o regresar a
// una búsqueda. Las tarjetas son las mismas del inicio (app-platillo-card).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';
import {
  CRITERIOS_VACIOS,
  CatalogoFacade,
  CriteriosBusqueda,
  DIETAS,
  Dieta,
  ETIQUETA_DIETA,
  ORDENES_BUSQUEDA,
  OrdenBusqueda,
  buscarPlatillos,
  filtrosActivos,
} from '@features/catalogo';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { PaginadorComponent, pagina } from '@shared/ui/paginador/paginador.component';
import { PlatilloCardComponent } from '@features/alumno/presentation/components/platillo-card/platillo-card.component';

const POR_PAGINA = 12;
/** Espera tras la última tecla antes de buscar: no se filtra a cada letra. */
export const ESPERA_BUSQUEDA_MS = 200;
const CLAVE_RECIENTES = 'cb.busquedas.recientes';
const MAX_RECIENTES = 6;

export const OPCIONES_PRECIO = [30, 50, 80] as const;
export const OPCIONES_TIEMPO = [5, 10, 15] as const;
export const OPCIONES_CALIFICACION = [4, 4.5] as const;

const ETIQUETA_ORDEN: Record<OrdenBusqueda, string> = {
  relevancia: 'Relevancia',
  precio_asc: 'Menor precio',
  precio_desc: 'Mayor precio',
  calificacion: 'Mejor calificados',
  tiempo: 'Más rápidos',
};

interface Pildora {
  clave: string;
  etiqueta: string;
  quitar: () => void;
}

/** Número de un query param, o null si no viene o no es número. */
function numero(valor: string | undefined): number | null {
  const n = valor ? Number(valor) : NaN;
  return Number.isFinite(n) ? n : null;
}

@Component({
  selector: 'app-buscar-page',
  imports: [NgTemplateOutlet, IconComponent, ModalComponent, PaginadorComponent, PlatilloCardComponent],
  templateUrl: './buscar.page.html',
  styleUrl: './buscar.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuscarPage implements OnInit {
  // Query params (withComponentInputBinding). `q` también llega desde el buscador de la barra superior.
  // OJO: si el parámetro no viene en la URL, el router pone la entrada en `undefined` (no en su valor por
  // defecto); por eso son `string | undefined` y se leen siempre con `?? ''`.
  readonly q = input<string | undefined>('');
  readonly categoria = input<string | undefined>('');
  readonly cafeteria = input<string | undefined>('');
  readonly precio = input<string | undefined>('');
  readonly tiempo = input<string | undefined>('');
  readonly calificacion = input<string | undefined>('');
  /** Dietas separadas por coma: ?dieta=vegetariano,sin_gluten */
  readonly dieta = input<string | undefined>('');
  readonly abiertas = input<string | undefined>('');
  readonly orden = input<string | undefined>('');

  private readonly catalogo = inject(CatalogoFacade);
  private readonly router = inject(Router);

  protected readonly porPagina = POR_PAGINA;
  protected readonly opcionesPrecio = OPCIONES_PRECIO;
  protected readonly opcionesTiempo = OPCIONES_TIEMPO;
  protected readonly opcionesCalificacion = OPCIONES_CALIFICACION;
  protected readonly dietas = DIETAS;
  protected readonly etiquetaDieta = ETIQUETA_DIETA;
  protected readonly ordenes = ORDENES_BUSQUEDA;
  protected readonly etiquetaOrden = ETIQUETA_ORDEN;

  protected readonly cargando = this.catalogo.cargando;
  protected readonly errorCarga = this.catalogo.error;
  protected readonly categorias = this.catalogo.categorias;
  protected readonly cafeterias = this.catalogo.menu;

  /** Lo que hay escrito en la caja, al instante. */
  protected readonly textoVivo = signal('');
  /** Criterios aplicados (el texto entra con la espera de ESPERA_BUSQUEDA_MS). */
  protected readonly criterios = signal<CriteriosBusqueda>({ ...CRITERIOS_VACIOS });
  protected readonly pagina = signal(1);
  protected readonly filtrosAbiertos = signal(false);
  protected readonly recientes = signal<string[]>(leerRecientes());

  protected readonly resultados = computed(() =>
    buscarPlatillos(this.catalogo.platillos(), this.criterios()),
  );
  protected readonly visibles = computed(() => pagina(this.resultados(), this.pagina(), POR_PAGINA));
  protected readonly nFiltros = computed(() => filtrosActivos(this.criterios()));
  protected readonly hayCriterios = computed(
    () => this.nFiltros() > 0 || !!this.criterios().texto.trim(),
  );

  /** Los filtros activos como pastillas que se quitan con un toque. */
  protected readonly pildoras = computed<Pildora[]>(() => {
    const c = this.criterios();
    const lista: Pildora[] = [];
    if (c.categoria) lista.push({ clave: 'cat', etiqueta: c.categoria, quitar: () => this.poner({ categoria: null }) });
    if (c.idCafeteria) {
      const nombre = this.catalogo.cafeteria(c.idCafeteria)?.cafeteria ?? 'Cafetería';
      lista.push({ clave: 'caf', etiqueta: nombre, quitar: () => this.poner({ idCafeteria: null }) });
    }
    if (c.precioMax !== null)
      lista.push({ clave: 'pre', etiqueta: `Hasta $${c.precioMax}`, quitar: () => this.poner({ precioMax: null }) });
    if (c.minutosMax !== null)
      lista.push({ clave: 'tie', etiqueta: `${c.minutosMax} min o menos`, quitar: () => this.poner({ minutosMax: null }) });
    if (c.calificacionMin !== null)
      lista.push({ clave: 'cal', etiqueta: `${c.calificacionMin}+ estrellas`, quitar: () => this.poner({ calificacionMin: null }) });
    for (const d of c.dietas)
      lista.push({ clave: d, etiqueta: ETIQUETA_DIETA[d], quitar: () => this.alternarDieta(d) });
    if (c.soloAbiertas)
      lista.push({ clave: 'abi', etiqueta: 'Solo abiertas', quitar: () => this.poner({ soloAbiertas: false }) });
    return lista;
  });

  private temporizador: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.temporizador && clearTimeout(this.temporizador));

    // El buscador de la barra superior puede cambiar ?q= estando ya en esta pantalla
    effect(() => {
      const q = this.q() ?? '';
      untracked(() => {
        if (q !== this.criterios().texto) {
          this.textoVivo.set(q);
          this.poner({ texto: q });
        }
      });
    });

    // Igual con ?categoria= (categorías y promociones del inicio)
    effect(() => {
      const categoria = this.categoria() || null;
      untracked(() => {
        if (categoria !== this.criterios().categoria) this.poner({ categoria });
      });
    });

    // Los criterios se reflejan en la URL (sin llenar el historial: replaceUrl)
    effect(() => {
      const c = this.criterios();
      untracked(() => this.escribirUrl(c));
    });

    // Si al filtrar la página actual queda fuera de rango, se regresa a la última que existe
    effect(() => {
      const paginas = Math.max(Math.ceil(this.resultados().length / POR_PAGINA), 1);
      if (untracked(this.pagina) > paginas) this.pagina.set(paginas);
    });
  }

  ngOnInit(): void {
    // Estado inicial desde la URL (los efectos de q y categoria ya pusieron esos dos)
    const dietas = (this.dieta() ?? '')
      .split(',')
      .filter((d): d is Dieta => (DIETAS as readonly string[]).includes(d));
    const ordenUrl = this.orden() ?? '';
    const orden = (ORDENES_BUSQUEDA as readonly string[]).includes(ordenUrl)
      ? (ordenUrl as OrdenBusqueda)
      : 'relevancia';
    this.criterios.update((c) => ({
      ...c,
      idCafeteria: this.cafeteria() || null,
      precioMax: numero(this.precio()),
      minutosMax: numero(this.tiempo()),
      calificacionMin: numero(this.calificacion()),
      dietas,
      soloAbiertas: this.abiertas() === '1',
      orden,
    }));
    this.cargarCatalogo();
  }

  protected cargarCatalogo(forzar = false): void {
    this.catalogo.cargar(forzar).subscribe({ error: () => undefined });
  }

  // ---------- Texto ----------

  protected escribir(event: Event): void {
    const texto = (event.target as HTMLInputElement).value;
    this.textoVivo.set(texto);
    if (this.temporizador) clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.poner({ texto }), ESPERA_BUSQUEDA_MS);
  }

  /** Enter o salir de la caja: guarda la búsqueda en "recientes". */
  protected confirmarTexto(): void {
    const texto = this.textoVivo().trim();
    if (this.temporizador) clearTimeout(this.temporizador);
    this.poner({ texto });
    if (texto.length >= 2) this.guardarReciente(texto);
  }

  protected usarReciente(texto: string): void {
    this.textoVivo.set(texto);
    this.poner({ texto });
  }

  protected borrarTexto(): void {
    this.textoVivo.set('');
    this.poner({ texto: '' });
  }

  protected borrarRecientes(): void {
    this.recientes.set([]);
    guardar(CLAVE_RECIENTES, []);
  }

  // ---------- Filtros ----------

  /** Cambia criterios y vuelve a la página 1 (los resultados son otros). */
  protected poner(cambio: Partial<CriteriosBusqueda>): void {
    this.criterios.update((c) => ({ ...c, ...cambio }));
    this.pagina.set(1);
  }

  /** Grupos de una sola opción: tocar la elegida la quita. */
  protected elegir<K extends 'precioMax' | 'minutosMax' | 'calificacionMin'>(clave: K, valor: number): void {
    this.poner({ [clave]: this.criterios()[clave] === valor ? null : valor } as Partial<CriteriosBusqueda>);
  }

  protected verCategoria(categoria: string | null): void {
    this.poner({ categoria: this.criterios().categoria === categoria ? null : categoria });
  }

  protected alternarDieta(dieta: Dieta): void {
    const actuales = this.criterios().dietas;
    this.poner({
      dietas: actuales.includes(dieta) ? actuales.filter((d) => d !== dieta) : [...actuales, dieta],
    });
  }

  protected onCafeteria(event: Event): void {
    this.poner({ idCafeteria: (event.target as HTMLSelectElement).value || null });
  }

  protected onOrden(event: Event): void {
    this.poner({ orden: (event.target as HTMLSelectElement).value as OrdenBusqueda });
  }

  protected limpiar(): void {
    this.textoVivo.set('');
    this.criterios.set({ ...CRITERIOS_VACIOS, orden: this.criterios().orden });
    this.pagina.set(1);
  }

  // ---------- Internos ----------

  private escribirUrl(c: CriteriosBusqueda): void {
    const queryParams: Record<string, string | null> = {
      q: c.texto.trim() || null,
      categoria: c.categoria,
      cafeteria: c.idCafeteria,
      precio: c.precioMax?.toString() ?? null,
      tiempo: c.minutosMax?.toString() ?? null,
      calificacion: c.calificacionMin?.toString() ?? null,
      dieta: c.dietas.length ? c.dietas.join(',') : null,
      abiertas: c.soloAbiertas ? '1' : null,
      orden: c.orden === 'relevancia' ? null : c.orden,
    };
    void this.router.navigate([], { queryParams, queryParamsHandling: 'merge', replaceUrl: true });
  }

  private guardarReciente(texto: string): void {
    const lista = [texto, ...this.recientes().filter((r) => r.toLowerCase() !== texto.toLowerCase())].slice(
      0,
      MAX_RECIENTES,
    );
    this.recientes.set(lista);
    guardar(CLAVE_RECIENTES, lista);
  }
}

// Las búsquedas recientes son una comodidad de este navegador: si el almacenamiento está bloqueado
// (modo privado), la pantalla funciona igual sin ellas.
function leerRecientes(): string[] {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_RECIENTES) ?? '[]');
    return Array.isArray(crudo) ? crudo.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function guardar(clave: string, valor: unknown): void {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento: no pasa nada, solo no se recuerdan
  }
}

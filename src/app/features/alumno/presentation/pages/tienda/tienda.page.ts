// CL-Sprint5 11/11/2026: tienda de una cafetería (/cafeterias/:id), etapa 3. Toma la idea del perfil de
// negocio estilo Facebook (portada, logo, datos) que tenía la maqueta de /negocio, ahora con datos del
// catálogo: menú por categoría, promociones del local, favorito, compartir y aviso si está cerrada.
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { CatalogoFacade, MetodoPago, PlatilloCatalogo } from '@features/catalogo';
import { CalificacionComponent } from '@shared/ui/calificacion/calificacion.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NombreIcono } from '@shared/ui/icon/icons';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { CorazonComponent } from '@features/alumno/presentation/components/corazon/corazon.component';
import { PlatilloCardComponent } from '@features/alumno/presentation/components/platillo-card/platillo-card.component';

const PROMOS = 'Promociones';

const METODO: Record<MetodoPago, { etiqueta: string; icono: NombreIcono }> = {
  efectivo: { etiqueta: 'Efectivo', icono: 'efectivo' },
  tarjeta: { etiqueta: 'Tarjeta', icono: 'tarjeta' },
  transferencia: { etiqueta: 'Transferencia', icono: 'transferencia' },
};

interface SeccionMenu {
  categoria: string;
  platillos: PlatilloCatalogo[];
}

@Component({
  selector: 'app-tienda-page',
  imports: [RouterLink, CalificacionComponent, IconComponent, CorazonComponent, PlatilloCardComponent],
  templateUrl: './tienda.page.html',
  styleUrl: './tienda.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiendaPage {
  /** Id de la URL (/cafeterias/:id), por withComponentInputBinding. */
  readonly id = input<string>('');

  private readonly catalogo = inject(CatalogoFacade);
  private readonly favoritos = inject(FavoritosFacade);
  private readonly toast = inject(ToastService);

  protected readonly metodo = METODO;
  protected readonly cargando = this.catalogo.cargando;
  /** La tienda no existe o no está activa (404). */
  protected readonly noEncontrada = signal(false);
  protected readonly errorCarga = signal<string | null>(null);

  protected readonly cafeteria = computed(() => this.catalogo.cafeteria(this.id()));
  /** CL-Sprint5 11/11/2026 (etapa 9): promociones activas que el encargado publicó para esta cafetería. */
  protected readonly promociones = computed(() =>
    this.catalogo.promociones().filter((p) => p.idCafeteria === this.id()),
  );


  /** Los platillos de la tienda, con su cafetería (lo que espera la tarjeta). */
  private readonly platillos = computed<PlatilloCatalogo[]>(() => {
    const c = this.cafeteria();
    return c
      ? c.productos.map((p) => ({
          ...p,
          idCafeteria: c.idCafeteria,
          cafeteria: c.cafeteria,
          cafeteriaAbierta: c.abierta,
        }))
      : [];
  });

  protected readonly categorias = computed(() => {
    const lista = this.platillos();
    const nombres = [...new Set(lista.map((p) => p.categoria ?? 'Otros'))];
    return lista.some((p) => p.precioAnterior) ? [PROMOS, ...nombres] : nombres;
  });

  /** null = todas las secciones. */
  protected readonly filtro = signal<string | null>(null);

  protected readonly secciones = computed<SeccionMenu[]>(() => {
    const lista = this.platillos();
    const filtro = this.filtro();
    return this.categorias()
      .filter((cat) => !filtro || cat === filtro)
      .map((categoria) => ({
        categoria,
        platillos:
          categoria === PROMOS
            ? lista.filter((p) => p.precioAnterior)
            : lista.filter((p) => (p.categoria ?? 'Otros') === categoria),
      }))
      .filter((s) => s.platillos.length);
  });

  constructor() {
    // Carga (o recarga) la tienda cada vez que cambia el id de la URL
    effect(() => {
      const id = this.id();
      if (!id) return;
      untracked(() => this.cargar(id));
    });
  }

  protected cargar(id = this.id()): void {
    this.noEncontrada.set(false);
    this.errorCarga.set(null);
    this.filtro.set(null);
    this.catalogo.cargarCafeteria(id).subscribe({
      error: (e: ApiError) => {
        if (e?.status === 404) this.noEncontrada.set(true);
        else this.errorCarga.set(e?.message ?? 'No se pudo cargar el menú.');
      },
    });
    this.favoritos.cargar().subscribe({ error: () => undefined });
    // Si fallan, la tienda simplemente no muestra la franja de promociones
    this.catalogo.cargarPromociones().subscribe({ error: () => undefined });
  }

  /** Comparte con el menú del sistema si existe (teléfono); si no, copia el enlace. */
  protected async compartir(): Promise<void> {
    const c = this.cafeteria();
    if (!c) return;
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${c.cafeteria} · CampusBite`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      this.toast.ok('Copiamos el enlace de la cafetería. Pégalo donde quieras.');
    } catch (e) {
      // Cerrar el menú de compartir no es un error
      if (e instanceof DOMException && e.name === 'AbortError') return;
      this.toast.error('No se pudo compartir. Copia la dirección del navegador.');
    }
  }

  /** Lleva a la sección elegida (o muestra todas). */
  protected verCategoria(categoria: string | null): void {
    this.filtro.set(this.filtro() === categoria ? null : categoria);
  }
}

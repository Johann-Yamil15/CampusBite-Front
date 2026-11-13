// FB-Sprint4 29/10/2026: pantalla principal del alumno (catálogo de cafeterías).
// CL-Sprint5 11/11/2026: etapa 3 del rediseño. Inicio estilo app de comida: saludo, pedido en curso,
// carrusel de promociones, categorías con foto, cafeterías destacadas y platillos populares con "+" rápido.
// El buscador ya no se repite aquí: vive en la barra superior (tableta/escritorio) y en la pestaña Buscar.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogoFacade, Promocion } from '@features/catalogo';
import { ETIQUETA_ETAPA, MisPedidosFacade, etapa } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { CafeteriaCardComponent } from '@features/alumno/presentation/components/cafeteria-card/cafeteria-card.component';
import { PlatilloCardComponent } from '@features/alumno/presentation/components/platillo-card/platillo-card.component';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';

interface CategoriaVisual {
  nombre: string;
  foto: string | null;
}

@Component({
  selector: 'app-inicio-page',
  imports: [DatePipe, RouterLink, IconComponent, CafeteriaCardComponent, PlatilloCardComponent],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioPage implements OnInit {
  private readonly catalogo = inject(CatalogoFacade);
  private readonly favoritos = inject(FavoritosFacade);
  private readonly perfil = inject(PerfilFacade);
  private readonly pedidos = inject(MisPedidosFacade);

  protected readonly cargando = this.catalogo.cargando;
  protected readonly error = this.catalogo.error;
  protected readonly cafeterias = this.catalogo.destacadas;
  protected readonly populares = this.catalogo.populares;
  protected readonly promociones = this.catalogo.promociones;
  protected readonly etiquetaEtapa = ETIQUETA_ETAPA;
  protected readonly etapa = etapa;

  // CL-Sprint5 11/11/2026 (etapa 8): el mismo nombre del layout y del perfil
  protected readonly primerNombre = computed(
    () => this.perfil.primerNombre(),
  );

  /** Cada categoría con la foto de su platillo mejor calificado. */
  protected readonly categorias = computed<CategoriaVisual[]>(() => {
    const platillos = this.catalogo.platillos();
    return this.catalogo.categorias().map((nombre) => {
      const mejor = platillos
        .filter((p) => p.categoria === nombre && p.imagenUrl)
        .sort((a, b) => (b.calificacion ?? 0) - (a.calificacion ?? 0))[0];
      return { nombre, foto: mejor?.imagenUrl ?? null };
    });
  });

  /** El pedido en curso más urgente: primero el que ya está listo para recoger. */
  protected readonly pedidoActivo = computed(() => {
    const enCurso = this.pedidos.enCurso();
    return enCurso.find((o) => o.estado === 'lista') ?? enCurso[0] ?? null;
  });

  protected readonly esqueletos = [1, 2, 3, 4];

  ngOnInit(): void {
    this.cargar();
    // El carrusel es un extra: si las promociones fallan, simplemente no se muestra
    this.catalogo.cargarPromociones().subscribe({ error: () => undefined });
    this.favoritos.cargar().subscribe({ error: () => undefined });
  }

  protected cargar(forzar = false): void {
    this.catalogo.cargar(forzar).subscribe({ error: () => undefined });
  }


  /** A dónde lleva una promoción: la tienda de su cafetería o el buscador por categoría. */
  protected enlacePromo(promo: Promocion): string[] {
    return promo.idCafeteria ? ['/cafeterias', promo.idCafeteria] : ['/buscar'];
  }

  protected parametrosPromo(promo: Promocion): Record<string, string> | null {
    return !promo.idCafeteria && promo.categoria ? { categoria: promo.categoria } : null;
  }

  // ---------- Carrusel ----------
  private readonly carrusel = viewChild<ElementRef<HTMLElement>>('carrusel');
  protected readonly diapositiva = signal(0);

  /** Avanza o regresa una diapositiva (botones de escritorio; en teléfono se desliza con el dedo). */
  protected mover(direccion: 1 | -1): void {
    const el = this.carrusel()?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.9, behavior: 'smooth' });
  }

  /** Marca el punto de la diapositiva visible mientras se desliza. */
  protected alDeslizar(): void {
    const el = this.carrusel()?.nativeElement;
    const ancho = el?.firstElementChild?.clientWidth;
    if (!el || !ancho) return;
    this.diapositiva.set(Math.round(el.scrollLeft / ancho));
  }

  protected irA(indice: number): void {
    const el = this.carrusel()?.nativeElement;
    const tarjeta = el?.children[indice] as HTMLElement | undefined;
    if (el && tarjeta) el.scrollTo({ left: tarjeta.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  }
}

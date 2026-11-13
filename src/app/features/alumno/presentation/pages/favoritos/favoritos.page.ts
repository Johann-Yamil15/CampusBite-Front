// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Cafeterías favoritas del alumno.
// CL-Sprint5 11/11/2026: lee, quita y restaura con FavoritosFacade (api/favoritos/...).
// CL-Sprint5 11/11/2026 (etapa 7): rediseño. Pestañas Platillos / Cafeterías (en la URL: ?ver=cafeterias).
//   - Los favoritos se cruzan con el menú de HOY (CatalogoFacade): el platillo se muestra con la misma
//     tarjeta del resto de la app (mismo flujo del carrito, con el aviso si el carrito es de otra
//     cafetería) y botón "Agregar"; si su cafetería está cerrada, la tarjeta lo dice y no deja pedir.
//   - Si la cafetería ya lo quitó de su menú, queda una tarjeta "Ya no disponible" con su menú a un toque.
//   - Las cafeterías usan app-cafeteria-card (llevan a su tienda y dicen si están abiertas).
//   - Quitar es el mismo corazón de toda la app, con "Deshacer" en el aviso.
//   - Carga con esqueletos, vacío por pestaña con botón para explorar y error con "Reintentar".
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { CatalogoFacade, MenuCafeteria, PlatilloCatalogo } from '@features/catalogo';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import {
  CafeteriaFavorita,
  PlatilloFavorito,
  TipoFavorito,
} from '@features/alumno/domain/models/favorito.model';
import { CafeteriaCardComponent } from '@features/alumno/presentation/components/cafeteria-card/cafeteria-card.component';
import { CorazonComponent } from '@features/alumno/presentation/components/corazon/corazon.component';
import {
  PlatilloCardComponent,
  SIN_IMAGEN,
} from '@features/alumno/presentation/components/platillo-card/platillo-card.component';

/** Un platillo favorito con su versión de hoy en el menú (o `null` si ya no está). */
interface FilaPlatillo {
  favorito: PlatilloFavorito;
  enMenu: PlatilloCatalogo | null;
}

interface FilaCafeteria {
  favorita: CafeteriaFavorita;
  enMenu: MenuCafeteria | null;
}

@Component({
  selector: 'app-favoritos-page',
  imports: [CurrencyPipe, RouterLink, IconComponent, CafeteriaCardComponent, CorazonComponent, PlatilloCardComponent],
  templateUrl: './favoritos.page.html',
  styleUrl: './favoritos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritosPage {
  /** ?ver=cafeterias (con withComponentInputBinding; si no viene llega `undefined`). */
  readonly ver = input<string | undefined>();

  private readonly favoritos = inject(FavoritosFacade);
  private readonly catalogo = inject(CatalogoFacade);
  private readonly router = inject(Router);

  protected readonly sinImagen = SIN_IMAGEN;
  protected readonly esqueletos = [0, 1, 2, 3];

  protected readonly pestana = computed<TipoFavorito>(() =>
    this.ver() === 'cafeterias' ? 'cafeteria' : 'platillo',
  );

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly platillos = computed<FilaPlatillo[]>(() => {
    const menu = this.catalogo.platillos();
    return this.favoritos.platillos().map((favorito) => ({
      favorito,
      enMenu: favorito.disponible ? (menu.find((p) => p.idProducto === favorito.idProducto) ?? null) : null,
    }));
  });

  protected readonly cafeterias = computed<FilaCafeteria[]>(() =>
    this.favoritos.cafeterias().map((favorita) => ({
      favorita,
      enMenu: this.catalogo.cafeteria(favorita.idCafeteria),
    })),
  );

  constructor() {
    this.cargar();
  }

  /** Siempre fresco al entrar: lo que importa es si hoy se puede pedir. */
  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    forkJoin([this.favoritos.cargar(true), this.catalogo.cargar()]).subscribe({
      next: () => this.cargando.set(false),
      error: (e: ApiError) => {
        this.cargando.set(false);
        this.error.set(e?.message ?? 'No pudimos cargar tus favoritos.');
      },
    });
  }

  protected verPestana(tipo: TipoFavorito): void {
    void this.router.navigate([], {
      queryParams: { ver: tipo === 'cafeteria' ? 'cafeterias' : null },
      replaceUrl: true,
    });
  }

  /** Flechas izquierda/derecha entre pestañas (patrón tablist de WAI-ARIA). */
  protected teclaPestana(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const otra: TipoFavorito = this.pestana() === 'platillo' ? 'cafeteria' : 'platillo';
    this.verPestana(otra);
    const lista = (event.currentTarget as HTMLElement).closest('[role="tablist"]');
    lista?.querySelector<HTMLElement>(`#tab-${otra}`)?.focus();
  }
}

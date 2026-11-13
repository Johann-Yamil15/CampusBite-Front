// CL-Sprint5 11/11/2026 (etapa 7): el corazón de favoritos, uno solo para toda la app del alumno (tarjetas
// de platillo y de cafetería, la tienda y Favoritos). Lee y cambia FavoritosFacade, que es una sola
// instancia en el layout: tocarlo en un lado lo cambia en todos.
//   - Cambia en el acto; si el back falla regresa y avisa.
//   - Al guardar late con un rebote corto y un destello (sin animación con prefers-reduced-motion).
//   - Al quitar avisa con "Deshacer", que lo devuelve a su lugar.
// Variantes: `foto` (botón redondo sobre una foto) y `etiqueta` (botón con texto "Guardar / Guardada").
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { ApiError } from '@core/http/api-error';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { TipoFavorito } from '@features/alumno/domain/models/favorito.model';

@Component({
  selector: 'app-corazon',
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="cz"
      [class.cz--etiqueta]="variante() === 'etiqueta'"
      [class.cb-btn]="variante() === 'etiqueta'"
      [class.cb-btn--secondary]="variante() === 'etiqueta'"
      [class.activo]="activo()"
      [class.late]="late()"
      [attr.aria-pressed]="activo()"
      [attr.aria-label]="variante() === 'foto' ? etiqueta() : null"
      [attr.title]="variante() === 'foto' ? etiqueta() : null"
      (click)="alternar($event)"
      (animationend)="late.set(false)"
    >
      <app-icon [nombre]="activo() ? 'corazon-lleno' : 'corazon'" />
      @if (variante() === 'etiqueta') {
        <span>{{ activo() ? 'Guardada' : 'Guardar' }}</span>
        <span class="sr-only"> {{ nombre() }} en favoritos</span>
      }
    </button>
  `,
  styleUrl: './corazon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CorazonComponent {
  readonly tipo = input.required<TipoFavorito>();
  /** idProducto o idCafeteria. */
  readonly id = input.required<string>();
  /** Para los avisos y el lector de pantalla. */
  readonly nombre = input.required<string>();
  readonly variante = input<'foto' | 'etiqueta'>('foto');

  private readonly favoritos = inject(FavoritosFacade);
  private readonly toast = inject(ToastService);

  protected readonly activo = computed(() => this.favoritos.esFavorito(this.tipo(), this.id()));
  /** Solo late cuando el alumno lo toca (no al pintar los que ya eran favoritos). */
  protected readonly late = signal(false);
  protected readonly etiqueta = computed(
    () => `${this.activo() ? 'Quitar' : 'Guardar'} ${this.nombre()} ${this.activo() ? 'de' : 'en'} favoritos`,
  );

  protected alternar(event: Event): void {
    // Vive dentro de tarjetas que son enlaces o abren un detalle: el toque es solo del corazón
    event.preventDefault();
    event.stopPropagation();
    this.late.set(!this.activo());
    this.cambiar(false);
  }

  private cambiar(esDeshacer: boolean): void {
    const tipo = this.tipo();
    const id = this.id();
    const nombre = this.nombre();
    this.favoritos.alternar(tipo, id).subscribe({
      next: (guardado) => {
        if (esDeshacer) {
          this.toast.ok(`${nombre} volvió a tus favoritos.`);
        } else if (guardado) {
          this.toast.ok(`${nombre} se guardó en tus favoritos.`);
        } else {
          this.toast.info(`${nombre} salió de tus favoritos.`, {
            etiqueta: 'Deshacer',
            ejecutar: () => this.cambiar(true),
          });
        }
      },
      error: (e: ApiError) => {
        this.late.set(false);
        this.toast.error(e?.message ?? 'No se pudo actualizar tus favoritos. Intenta de nuevo.');
      },
    });
  }
}

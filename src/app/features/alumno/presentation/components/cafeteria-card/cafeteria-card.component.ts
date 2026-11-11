// CL-Sprint5 11/11/2026: tarjeta de cafetería (etapa 3). Portada con velo y nombre encima en blanco (el velo
// garantiza el contraste sobre cualquier foto y en cualquier tema), corazón de favorito, calificación,
// tiempo, punto de entrega y si está abierta. Toda la tarjeta lleva a la tienda /cafeterias/:id.
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MenuCafeteria } from '@features/catalogo';
import { CalificacionComponent } from '@shared/ui/calificacion/calificacion.component';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-cafeteria-card',
  imports: [RouterLink, CalificacionComponent, IconComponent],
  template: `
    @let c = cafeteria();
    <article class="cc cb-card cb-card--interactiva" [class.cc-cerrada]="!c.abierta">
      <div class="cb-media cb-media--16x9 cb-media--velo cc-portada">
        @if (c.portadaUrl) {
          <img [src]="c.portadaUrl" alt="" loading="lazy" width="320" height="180" />
        }
        @if (!c.abierta) {
          <span class="cb-badge cb-badge--foto cc-estado-foto">Cerrada ahora</span>
        }
        <div class="cc-sobre">
          @if (c.logoUrl) {
            <img class="cc-logo" [src]="c.logoUrl" alt="" width="44" height="44" />
          }
          <h3 class="cc-nombre">{{ c.cafeteria }}</h3>
        </div>
      </div>

      <!-- Capa de enlace sobre toda la tarjeta (el corazón queda encima de ella) -->
      <a
        class="cc-capa"
        [routerLink]="['/cafeterias', c.idCafeteria]"
        [attr.aria-label]="'Ver el menú de ' + c.cafeteria"
      ></a>

      <button
        type="button"
        class="cc-fav"
        [class.activo]="favorita()"
        [attr.aria-pressed]="favorita()"
        [attr.aria-label]="(favorita() ? 'Quitar ' : 'Guardar ') + c.cafeteria + (favorita() ? ' de favoritos' : ' en favoritos')"
        (click)="alternarFavorito.emit(c.idCafeteria)"
      >
        <app-icon [nombre]="favorita() ? 'corazon-lleno' : 'corazon'" />
      </button>

      <div class="cc-cuerpo">
        <p class="cb-meta">
          @if (c.calificacion) {
            <app-calificacion [valor]="c.calificacion" [resenas]="c.resenas" />
          }
          @if (c.minutosEstimados) {
            <span><app-icon nombre="reloj" />~{{ c.minutosEstimados }} min</span>
          }
        </p>
        <p class="cc-entrega"><app-icon nombre="ubicacion" />{{ c.puntoEntrega }}</p>
        <span class="cb-estado-local" [class.cerrado]="!c.abierta">
          @if (c.abierta) {
            Abierta{{ c.cierraA ? ' hasta ' + c.cierraA : '' }}
          } @else {
            Cerrada ahora
          }
        </span>
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    .cc {
      position: relative;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }
    .cc-cerrada .cc-portada img {
      filter: grayscale(0.6);
    }
    .cc-estado-foto {
      position: absolute;
      top: 0.6rem;
      left: 0.6rem;
      z-index: 1;
    }
    .cc-sobre {
      position: absolute;
      inset: auto 0.75rem 0.7rem;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .cc-logo {
      flex-shrink: 0;
      border: 2px solid var(--cb-on-image);
      border-radius: var(--cb-radius-pill);
      object-fit: cover;
      background: var(--cb-surface);
    }
    .cc-nombre {
      margin: 0;
      min-width: 0;
      font-size: var(--cb-text-lg);
      font-weight: 800;
      line-height: var(--cb-leading-tight);
      /* Texto sobre la foto: siempre blanco con el velo debajo, en claro y en oscuro */
      color: var(--cb-on-image);
      text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
    }
    .cc-capa {
      position: absolute;
      inset: 0;
      z-index: 2;
      border-radius: inherit;
    }
    .cc-capa:focus-visible {
      outline: none;
      box-shadow: var(--cb-focus-ring);
    }
    .cc-fav {
      position: absolute;
      top: 0.6rem;
      right: 0.6rem;
      z-index: 3;
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 0;
      border-radius: var(--cb-radius-pill);
      background: var(--cb-surface);
      color: var(--cb-ink-soft);
      box-shadow: var(--cb-shadow-sm);
      cursor: pointer;
      --icon-size: 1.25rem;
    }
    .cc-fav:focus-visible {
      outline: none;
      box-shadow: var(--cb-focus-ring);
    }
    .cc-fav.activo {
      color: var(--cb-danger-action);
    }
    .cc-fav.activo app-icon {
      animation: cb-rebote var(--cb-dur-enter) var(--cb-ease-spring);
    }
    .cc-cuerpo {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 0.75rem 0.85rem 0.9rem;
    }
    .cc-entrega {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      margin: 0;
      min-width: 0;
      font-size: var(--cb-text-sm);
      color: var(--cb-text-muted);
      --icon-size: 0.95rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .cc-fav.activo app-icon {
        animation: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CafeteriaCardComponent {
  readonly cafeteria = input.required<MenuCafeteria>();
  readonly favorita = input(false);
  readonly alternarFavorito = output<string>();
}

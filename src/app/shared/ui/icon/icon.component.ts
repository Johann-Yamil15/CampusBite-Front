// CL-Sprint5 11/11/2026: ícono del sistema de diseño. <app-icon nombre="buscar" /> dibuja el SVG con el
// color del texto (currentColor) y el tamaño de --icon-size (1.25rem por defecto).
// Accesibilidad: es decorativo (aria-hidden) salvo que se le dé `etiqueta`, y entonces se anuncia como
// imagen. Un botón de solo ícono pone su nombre en el botón (aria-label o .sr-only), no aquí.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ICONOS, Icono, NombreIcono } from './icons';

@Component({
  selector: 'app-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.fill]="icono().relleno ? 'currentColor' : 'none'"
      [attr.stroke]="icono().relleno ? null : 'currentColor'"
      [attr.stroke-width]="grosor()"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      @for (d of icono().d; track $index) {
        <path [attr.d]="d" [attr.fill-rule]="icono().relleno ? 'evenodd' : null" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      width: var(--icon-size, 1.25rem);
      height: var(--icon-size, 1.25rem);
      line-height: 0;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    '[attr.aria-hidden]': 'etiqueta() ? null : "true"',
    '[attr.role]': 'etiqueta() ? "img" : null',
    '[attr.aria-label]': 'etiqueta()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  readonly nombre = input.required<NombreIcono>();
  /** Si el ícono comunica algo por sí solo (sin texto al lado), su nombre accesible. */
  readonly etiqueta = input<string | null>(null);
  /** Grosor del trazo; 1.75 es el de la app. */
  readonly grosor = input(1.75);

  protected readonly icono = computed<Icono>(() => ICONOS[this.nombre()]);
}

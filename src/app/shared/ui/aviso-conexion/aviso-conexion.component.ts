// CL-Sprint5 26/11/2026: franja de conexión para toda la app (alumno, encargado y login). Va una sola vez en la
// raíz (app.ts). Sin internet muestra la franja fija arriba (abajo están la barra del alumno, la barra del
// carrito y los avisos flotantes); al volver, "Conexión restablecida" unos segundos.
// Mientras se ve, publica su alto en --cb-aviso-conexion-alto (en <html>) para que la página y las barras
// pegajosas bajen lo mismo y nada quede tapado. Con conexión la variable no existe: todo queda como antes.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  afterNextRender,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ConexionService } from '@core/services/conexion.service';
import { IconComponent } from '@shared/ui/icon/icon.component';

/** Cuánto se ve "Conexión restablecida". */
export const DURACION_RESTABLECIDA_MS = 4000;
export const VARIABLE_ALTO = '--cb-aviso-conexion-alto';

@Component({
  selector: 'app-aviso-conexion',
  imports: [IconComponent],
  template: `
    <div #region class="ac-region" role="status" aria-live="polite">
      @if (!enLinea()) {
        <p class="ac ac--sin-red">
          <app-icon nombre="sin-red" />
          <span>Sin conexión. Tus cambios se guardan y se enviarán al volver el internet</span>
        </p>
      } @else if (restablecida()) {
        <p class="ac ac--ok">
          <app-icon nombre="palomita-circulo" />
          <span>Conexión restablecida</span>
        </p>
      }
    </div>
  `,
  styleUrl: './aviso-conexion.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisoConexionComponent {
  private readonly conexion = inject(ConexionService);
  private readonly raiz = inject(DOCUMENT).documentElement;
  private readonly region = viewChild.required<ElementRef<HTMLElement>>('region');

  protected readonly enLinea = this.conexion.enLinea;
  protected readonly restablecida = signal(false);
  readonly visible = computed(() => !this.enLinea() || this.restablecida());

  constructor() {
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const sub = this.conexion.reconectado$.subscribe(() => {
      this.restablecida.set(true);
      clearTimeout(temporizador);
      temporizador = setTimeout(() => this.restablecida.set(false), DURACION_RESTABLECIDA_MS);
    });

    let observador: ResizeObserver | undefined;
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      observador = new ResizeObserver(() => this.publicarAlto());
      observador.observe(this.region().nativeElement);
    });

    inject(DestroyRef).onDestroy(() => {
      sub.unsubscribe();
      clearTimeout(temporizador);
      observador?.disconnect();
      this.raiz.style.removeProperty(VARIABLE_ALTO);
    });
  }

  private publicarAlto(): void {
    const alto = Math.ceil(this.region().nativeElement.getBoundingClientRect().height);
    if (alto > 0) this.raiz.style.setProperty(VARIABLE_ALTO, `${alto}px`);
    else this.raiz.style.removeProperty(VARIABLE_ALTO);
  }
}

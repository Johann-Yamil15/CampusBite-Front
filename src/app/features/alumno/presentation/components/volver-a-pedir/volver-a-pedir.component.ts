// CL-Sprint5 11/11/2026 (etapa 6): "Volver a pedir". Trae el menú de HOY de la cafetería y arma el carrito
// con los mismos productos reales (por su id de producto, no por el folio) y su precio vigente.
//   - Si todo está disponible y el carrito está libre (o es de la misma cafetería): agrega y abre el carrito.
//   - Si algo ya no está en el menú o el carrito tiene productos de otra cafetería: primero lo explica en
//     una hoja (modal) y el alumno decide.
// Se usa en el detalle del pedido y en las tarjetas del historial (y servirá para favoritos).
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { CatalogoFacade } from '@features/catalogo';
import { Orden } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { PlanRepetir, planRepetir } from '@features/alumno/domain/models/volver-a-pedir.model';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';

@Component({
  selector: 'app-volver-a-pedir',
  imports: [CurrencyPipe, RouterLink, IconComponent, ModalComponent],
  template: `
    <button
      type="button"
      class="cb-btn vp-boton"
      [class.cb-btn--primary]="variante() === 'primario'"
      [class.cb-btn--secondary]="variante() === 'secundario'"
      [class.cb-btn--small]="compacto()"
      [disabled]="cargando()"
      [attr.aria-busy]="cargando()"
      (click)="iniciar()"
    >
      <app-icon nombre="recargar" />{{ cargando() ? 'Revisando el menú…' : 'Volver a pedir' }}
    </button>

    @if (plan(); as p) {
      <app-modal title="Volver a pedir" [subtitle]="orden().cafeteria" size="sm" (closed)="cerrar()">
        @if (p.items.length) {
          <p class="vp-intro">Esto agregaremos a tu carrito, con los precios de hoy:</p>
          <ul class="vp-lista">
            @for (item of p.items; track item.idProducto) {
              <li>
                <span>{{ item.cantidad }}× {{ item.producto }}</span>
                <strong>{{ item.precio * item.cantidad | currency: 'MXN' : 'symbol-narrow' }}</strong>
              </li>
            }
          </ul>
        } @else {
          <p class="vp-intro">Ninguno de estos productos está en el menú de hoy.</p>
        }

        @if (p.noDisponibles.length) {
          <p class="vp-aviso" role="status">
            <app-icon nombre="alerta" />
            <span>Ya no están disponibles: <strong>{{ p.noDisponibles.join(', ') }}</strong>.</span>
          </p>
        }
        @if (p.items.length && otraCafeteria(); as otra) {
          <p class="vp-aviso" role="status">
            <app-icon nombre="info" />
            <span>Tu carrito tiene productos de <strong>{{ otra }}</strong>. Para pedir aquí lo vaciamos primero.</span>
          </p>
        }

        <div modalActions>
          <button type="button" class="cb-btn cb-btn--secondary" (click)="cerrar()">Cancelar</button>
          @if (p.items.length) {
            <button type="button" class="cb-btn cb-btn--primary" data-modal-focus (click)="agregar(p)">
              {{ otraCafeteria() ? 'Vaciar y agregar' : 'Agregar al carrito' }}
            </button>
          } @else {
            <a class="cb-btn cb-btn--primary" data-modal-focus [routerLink]="['/cafeterias', orden().idCafeteria]" (click)="cerrar()">
              Ver su menú
            </a>
          }
        </div>
      </app-modal>
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .vp-boton {
      --icon-size: 1.05rem;
    }
    .vp-intro {
      margin: 0 0 0.5rem;
      color: var(--cb-ink-soft);
    }
    .vp-lista {
      list-style: none;
      margin: 0 0 var(--cb-space-md);
      padding: 0;
      li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--cb-line-soft);
        color: var(--cb-ink);
      }
    }
    .vp-aviso {
      display: flex;
      gap: 0.5rem;
      margin: 0 0 0.6rem;
      padding: 0.65rem 0.8rem;
      border: 1px solid var(--cb-primary-container);
      border-radius: var(--cb-radius);
      background: var(--cb-brand-soft);
      color: var(--cb-ink);
      font-size: var(--cb-text-sm);
      --icon-size: 1.1rem;
      app-icon {
        flex-shrink: 0;
        color: var(--cb-primary);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolverAPedirComponent {
  readonly orden = input.required<Orden>();
  readonly variante = input<'primario' | 'secundario'>('primario');
  readonly compacto = input(false);

  private readonly catalogo = inject(CatalogoFacade);
  private readonly carrito = inject(CarritoStore);
  private readonly ui = inject(CarritoUiService);
  private readonly toast = inject(ToastService);

  protected readonly cargando = signal(false);
  /** El plan que se está confirmando en la hoja; null = cerrada. */
  protected readonly plan = signal<PlanRepetir | null>(null);

  /** Nombre de la otra cafetería si el carrito tiene productos de una distinta. */
  protected readonly otraCafeteria = computed(() => {
    const id = this.carrito.idCafeteria();
    return id && id !== this.orden().idCafeteria ? this.carrito.cafeteria() : null;
  });

  protected iniciar(): void {
    const orden = this.orden();
    this.cargando.set(true);
    // Siempre el menú fresco: lo que importa es lo que se puede pedir hoy
    this.catalogo.cargarCafeteria(orden.idCafeteria).subscribe({
      next: (menu) => {
        this.cargando.set(false);
        const plan = planRepetir(
          orden.lineas,
          menu.productos.map((p) => ({
            idProducto: p.idProducto,
            producto: p.producto,
            precio: p.precio,
            imagenUrl: p.imagenUrl,
          })),
          { idCafeteria: menu.idCafeteria, nombre: menu.cafeteria },
        );
        if (plan.items.length && !plan.noDisponibles.length && !this.otraCafeteria()) {
          this.agregar(plan);
        } else {
          this.plan.set(plan);
        }
      },
      error: (e: ApiError) => {
        this.cargando.set(false);
        this.toast.error(
          e?.status === 404
            ? `${orden.cafeteria} ya no está recibiendo pedidos en CampusBite.`
            : (e?.message ?? 'No pudimos revisar el menú. Intenta de nuevo.'),
        );
      },
    });
  }

  protected agregar(plan: PlanRepetir): void {
    if (this.otraCafeteria()) this.carrito.vaciar();
    for (const item of plan.items) this.carrito.agregar(item);
    this.plan.set(null);
    this.ui.abrir();
    const piezas = plan.items.reduce((s, i) => s + i.cantidad, 0);
    const faltan = plan.noDisponibles.length;
    const agregados = `Agregamos ${piezas} ${piezas === 1 ? 'artículo' : 'artículos'} a tu carrito`;
    this.toast.ok(
      faltan
        ? `${agregados}; ${faltan === 1 ? '1 ya no estaba disponible' : `${faltan} ya no estaban disponibles`}.`
        : `${agregados}.`,
    );
  }

  protected cerrar(): void {
    this.plan.set(null);
  }
}

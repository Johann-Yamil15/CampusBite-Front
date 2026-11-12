// FB-Sprint4 01/11/2026: Panel lateral global del carrito con resumen, vaciar y confirmar pedido.
// CL-Sprint5 11/11/2026 (etapa 5): reescrito sin Angular Material (era la única parte de la app que lo
// usaba). Panel a la derecha en tableta y escritorio; hoja que sube desde abajo en teléfono. Vaciar pide
// confirmación en el mismo panel. "Continuar" abre el checkout (app-checkout), que reemplaza al diálogo de
// Material confirmar-orden. El abierto/cerrado vive en CarritoUiService.
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { CarritoItemComponent } from '@features/alumno/presentation/components/carrito-item/carrito-item.component';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';

@Component({
  selector: 'app-carrito-drawer',
  imports: [CurrencyPipe, RouterLink, IconComponent, CarritoItemComponent],
  templateUrl: './carrito-drawer.component.html',
  styleUrl: './carrito-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'alEscape()' },
})
export class CarritoDrawerComponent {
  protected readonly carrito = inject(CarritoStore);
  protected readonly ui = inject(CarritoUiService);
  private readonly toast = inject(ToastService);

  protected readonly confirmandoVaciar = signal(false);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Al abrir, el foco entra al panel (teclado y lector de pantalla) y se olvida un "vaciar" a medias
    effect(() => {
      const panel = this.panel()?.nativeElement;
      if (this.ui.abierto() && panel) {
        this.confirmandoVaciar.set(false);
        queueMicrotask(() => panel.focus());
      }
    });
  }

  protected alEscape(): void {
    if (this.ui.abierto()) this.ui.cerrar();
  }

  protected vaciar(): void {
    const cafeteria = this.carrito.cafeteria();
    this.carrito.vaciar();
    this.confirmandoVaciar.set(false);
    this.toast.info(`Vaciaste tu carrito de ${cafeteria}.`);
  }

  protected continuar(): void {
    if (!this.carrito.isEmpty()) this.ui.abrirCheckout();
  }
}

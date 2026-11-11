// CL-Sprint5 11/11/2026 (etapa 5): confirmación del pedido (/pedidos/:id/confirmado), a donde lleva el
// checkout. Lo importante en grande: el código de recogida de 6 dígitos (estilo DiDi Food), cuándo y dónde
// recoger y qué sigue según el método de pago. El seguimiento en vivo vive en el detalle (/pedidos/:id).
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ETIQUETA_ETAPA, MisPedidosFacade, etapa, piezas } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { CodigoRecogidaComponent } from '@features/alumno/presentation/components/codigo-recogida/codigo-recogida.component';
import { INFO_METODO } from '@features/alumno/presentation/components/checkout/checkout.component';

/** Datos de transferencia de la demo (el back los daría por cafetería). */
export const CUENTA_DEMO = { banco: 'Banco Demo', clabe: '002 180 0000 1234 5678' };

@Component({
  selector: 'app-pedido-confirmado-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, IconComponent, CodigoRecogidaComponent],
  templateUrl: './pedido-confirmado.page.html',
  styleUrl: './pedido-confirmado.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoConfirmadoPage {
  readonly id = input<string>('');

  private readonly pedidos = inject(MisPedidosFacade);

  protected readonly infoMetodo = INFO_METODO;
  protected readonly cuenta = CUENTA_DEMO;
  protected readonly etiquetaEtapa = ETIQUETA_ETAPA;
  protected readonly etapa = etapa;
  protected readonly piezas = piezas;
  protected readonly cargando = this.pedidos.cargando;

  protected readonly pedido = computed(() => this.pedidos.porId(this.id()));

  constructor() {
    // Si se entra directo (recarga, enlace), se trae el pedido
    effect(() => {
      const id = this.id();
      untracked(() => {
        if (id && !this.pedidos.porId(id)) this.pedidos.obtener(id).subscribe({ error: () => undefined });
      });
    });
  }
}

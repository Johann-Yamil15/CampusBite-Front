// CL-Sprint5 11/11/2026 (etapa 6): tarjeta de un pedido en "Mis pedidos". Toda la tarjeta lleva al detalle
// (enlace estirado en el nombre de la cafetería); los botones quedan por encima y hacen lo suyo.
//   - Activo: barra de 4 tramos con el avance y, si ya está listo, el código a la vista.
//   - Historial: "Volver a pedir" a un toque.
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ETAPAS_ALUMNO, ETIQUETA_ETAPA, Orden, enCurso, etapa, pasoAlumno } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { detalleEtapa, resumenLineas } from '@features/alumno/presentation/pedido-texto';
import { VolverAPedirComponent } from '@features/alumno/presentation/components/volver-a-pedir/volver-a-pedir.component';

@Component({
  selector: 'app-pedido-card',
  imports: [CurrencyPipe, DatePipe, RouterLink, IconComponent, VolverAPedirComponent],
  templateUrl: './pedido-card.component.html',
  styleUrl: './pedido-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoCardComponent {
  readonly orden = input.required<Orden>();

  protected readonly sinImagen = 'assets/images/producto-sin-imagen.svg';
  protected readonly tramos = ETAPAS_ALUMNO;

  protected readonly etapa = computed(() => etapa(this.orden().estado));
  protected readonly etiqueta = computed(() => ETIQUETA_ETAPA[this.etapa()]);
  protected readonly activo = computed(() => enCurso(this.orden()));
  protected readonly paso = computed(() => pasoAlumno(this.orden().estado));
  protected readonly detalle = computed(() => detalleEtapa(this.orden()));
  protected readonly resumen = computed(() => resumenLineas(this.orden()));
  protected readonly codigo = computed(() => {
    // El alumno dueño siempre lo recibe; el tipo admite null porque la cafetería no lo recibe
    const c = this.orden().codigoRecogida ?? '';
    return `${c.slice(0, 3)} ${c.slice(3)}`;
  });
}

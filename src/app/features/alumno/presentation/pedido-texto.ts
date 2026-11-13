// CL-Sprint5 11/11/2026 (etapa 6): textos de un pedido que comparten la lista, la tarjeta y el detalle.
import { Etapa, Orden } from '@features/ordenes';
import { NombreIcono } from '@shared/ui/icon/icons';

export const ICONO_ETAPA: Record<Etapa, NombreIcono> = {
  recibido: 'bolsa',
  en_preparacion: 'fuego',
  listo: 'campana',
  entregado: 'palomita-circulo',
  cancelado: 'cerrar',
};

/** Qué pasa en cada paso, para el alumno. */
export function detalleEtapa(orden: Pick<Orden, 'estado' | 'puntoEntrega'>): string {
  switch (orden.estado) {
    case 'pendiente':
      return 'Esperando que la cafetería confirme tu pago.';
    case 'confirmada':
      return 'La cafetería ya tiene tu pedido y pronto empieza a prepararlo.';
    case 'en_preparacion':
      return 'Lo están preparando ahora mismo.';
    case 'lista':
      return `Recógelo en ${orden.puntoEntrega} con tu código.`;
    case 'entregada':
      return '¡Buen provecho!';
    case 'cancelada':
      return 'Este pedido se canceló y no se preparará.';
  }
}

/** Cómo va el pago, en palabras del alumno. */
export function textoPago(orden: Pick<Orden, 'metodo' | 'estadoPago'>): string {
  switch (orden.estadoPago) {
    case 'pagado':
      return 'Pagado';
    case 'cancelado':
      return 'Sin cobro';
    case 'reembolsado':
      return 'Reembolsado';
    case 'rechazado':
      return 'Pago rechazado';
    case 'pendiente':
      return orden.metodo === 'efectivo' ? 'Pagas al recoger' : 'Esperando tu pago';
  }
}

/** "2 artículos · Sándwich Clásico y 1 más". */
export function resumenLineas(orden: Pick<Orden, 'lineas'>): string {
  const piezas = orden.lineas.reduce((s, l) => s + l.cantidad, 0);
  const [primera, ...resto] = orden.lineas;
  const extra = resto.length ? ` y ${resto.length} más` : '';
  return `${piezas} ${piezas === 1 ? 'artículo' : 'artículos'} · ${primera?.producto ?? ''}${extra}`;
}

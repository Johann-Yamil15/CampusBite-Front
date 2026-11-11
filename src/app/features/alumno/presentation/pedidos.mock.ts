// JY-Sprint4 05/11/2026: cascarón visual. Datos fijos para las pantallas del alumno mientras el back no
// expone órdenes (sp_crear_orden / sp_mis_ordenes están en la BD, falta el controller). Al conectar la HU
// este archivo se borra y las pantallas leen de la facade.

/** Los mismos estados del ENUM estado_orden de la BD, en el orden en que avanzan. */
export const ESTADOS_PEDIDO = ['recibido', 'en_preparacion', 'listo', 'entregado'] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number] | 'cancelado';

export interface ItemPedido {
  producto: string;
  cantidad: number;
  precio: number;
  foto: string;
}

export interface Pedido {
  folio: string;
  cafeteria: string;
  logo: string;
  estado: EstadoPedido;
  creadoEn: string;
  recogidaEn: string;
  puntoEntrega: string;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  notas: string | null;
  items: ItemPedido[];
}

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'Recibido',
  en_preparacion: 'En preparación',
  listo: 'Listo para recoger',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const PEDIDOS: Pedido[] = [
  {
    folio: 'CB-2411-0042',
    cafeteria: 'Cafetería Central',
    logo: 'https://picsum.photos/seed/cb-logo-central/80/80',
    estado: 'en_preparacion',
    creadoEn: '2026-11-05T12:05:00',
    recogidaEn: '2026-11-05T13:30:00',
    puntoEntrega: 'Barra principal, Edificio A',
    metodo: 'efectivo',
    notas: 'Sin cebolla, por favor.',
    items: [
      { producto: 'Sándwich Clásico de Pollo', cantidad: 1, precio: 55, foto: 'https://picsum.photos/seed/cb-menu-sandwich/120/120' },
      { producto: 'Latte Helado', cantidad: 2, precio: 38, foto: 'https://picsum.photos/seed/cb-menu-latte/120/120' },
    ],
  },
  {
    folio: 'CB-2411-0041',
    cafeteria: 'Rincón Verde',
    logo: 'https://picsum.photos/seed/cb-logo-rincon/80/80',
    estado: 'listo',
    creadoEn: '2026-11-05T11:10:00',
    recogidaEn: '2026-11-05T12:00:00',
    puntoEntrega: 'Mostrador, Patio central',
    metodo: 'transferencia',
    notas: null,
    items: [
      { producto: 'Bowl de Pollo', cantidad: 1, precio: 72, foto: 'https://picsum.photos/seed/cb-menu-bowlpollo/120/120' },
    ],
  },
  {
    folio: 'CB-2411-0038',
    cafeteria: 'Sabor Universitario',
    logo: 'https://picsum.photos/seed/cb-logo-sabor/80/80',
    estado: 'entregado',
    creadoEn: '2026-11-04T14:20:00',
    recogidaEn: '2026-11-04T15:00:00',
    puntoEntrega: 'Barra 2, Comedor',
    metodo: 'tarjeta',
    notas: null,
    items: [
      { producto: 'Hamburguesa Clásica', cantidad: 1, precio: 79, foto: 'https://picsum.photos/seed/cb-menu-hamburguesa/120/120' },
      { producto: 'Papas a la Francesa', cantidad: 1, precio: 32, foto: 'https://picsum.photos/seed/cb-menu-papas/120/120' },
    ],
  },
  {
    folio: 'CB-2411-0035',
    cafeteria: 'Café Express',
    logo: 'https://picsum.photos/seed/cb-logo-express/80/80',
    estado: 'cancelado',
    creadoEn: '2026-11-03T09:40:00',
    recogidaEn: '2026-11-03T10:15:00',
    puntoEntrega: 'Kiosco, Entrada norte',
    metodo: 'efectivo',
    notas: null,
    items: [
      { producto: 'Latte Helado', cantidad: 1, precio: 38, foto: 'https://picsum.photos/seed/cb-menu-latte/120/120' },
    ],
  },
];

export const total = (pedido: Pedido): number =>
  pedido.items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);

/** Un pedido sigue en curso mientras no se entrega ni se cancela. */
export const enCurso = (pedido: Pedido): boolean =>
  pedido.estado !== 'entregado' && pedido.estado !== 'cancelado';

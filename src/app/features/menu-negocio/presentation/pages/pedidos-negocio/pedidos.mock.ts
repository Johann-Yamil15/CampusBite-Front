// JY-Sprint4 05/11/2026: cascarón visual. Pedidos de muestra para el tablero del negocio mientras el back
// no expone órdenes (sp_crear_orden, sp_cambiar_estado_orden, sp_entregar_orden y sp_cancelar_orden están
// en la BD, falta el controller). Al conectar la HU este archivo se borra.

/** Columnas del tablero, en el orden en que avanza un pedido. */
export const COLUMNAS = ['recibido', 'en_preparacion', 'listo'] as const;
export type Columna = (typeof COLUMNAS)[number];
export type EstadoOrden = Columna | 'entregado' | 'cancelado';

export interface LineaOrden {
  producto: string;
  cantidad: number;
  precio: number;
}

export interface OrdenNegocio {
  folio: string;
  alumno: string;
  matricula: string;
  estado: EstadoOrden;
  creadoEn: string;
  recogidaEn: string;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia';
  notas: string | null;
  lineas: LineaOrden[];
}

export const ETIQUETA_COLUMNA: Record<Columna, string> = {
  recibido: 'Nuevos',
  en_preparacion: 'En preparación',
  listo: 'Listos para recoger',
};

export const ETIQUETA_ESTADO: Record<EstadoOrden, string> = {
  recibido: 'Nuevo',
  en_preparacion: 'En preparación',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ORDENES: OrdenNegocio[] = [
  {
    folio: 'CB-2411-0045',
    alumno: 'Ana Ramírez',
    matricula: '23300118',
    estado: 'recibido',
    creadoEn: '2026-11-05T12:41:00',
    recogidaEn: '2026-11-05T13:15:00',
    metodo: 'efectivo',
    notas: 'Para llevar.',
    lineas: [
      { producto: 'Chilaquiles Verdes', cantidad: 2, precio: 58 },
      { producto: 'Café Americano', cantidad: 2, precio: 28 },
    ],
  },
  {
    folio: 'CB-2411-0044',
    alumno: 'Luis Ortega',
    matricula: '23300077',
    estado: 'recibido',
    creadoEn: '2026-11-05T12:38:00',
    recogidaEn: '2026-11-05T13:00:00',
    metodo: 'transferencia',
    notas: null,
    lineas: [{ producto: 'Panini Caprese', cantidad: 1, precio: 49 }],
  },
  {
    folio: 'CB-2411-0042',
    alumno: 'Juan Pérez',
    matricula: '23300022',
    estado: 'en_preparacion',
    creadoEn: '2026-11-05T12:05:00',
    recogidaEn: '2026-11-05T13:30:00',
    metodo: 'efectivo',
    notas: 'Sin cebolla, por favor.',
    lineas: [
      { producto: 'Sándwich Clásico de Pollo', cantidad: 1, precio: 55 },
      { producto: 'Latte Helado', cantidad: 2, precio: 38 },
    ],
  },
  {
    folio: 'CB-2411-0040',
    alumno: 'Sofía Mendoza',
    matricula: '23300204',
    estado: 'en_preparacion',
    creadoEn: '2026-11-05T11:52:00',
    recogidaEn: '2026-11-05T12:40:00',
    metodo: 'tarjeta',
    notas: null,
    lineas: [
      { producto: 'Ensalada César', cantidad: 1, precio: 62 },
      { producto: 'Galletas de Avena', cantidad: 1, precio: 25 },
    ],
  },
  {
    folio: 'CB-2411-0039',
    alumno: 'Diego Salas',
    matricula: '23300131',
    estado: 'listo',
    creadoEn: '2026-11-05T11:30:00',
    recogidaEn: '2026-11-05T12:10:00',
    metodo: 'efectivo',
    notas: null,
    lineas: [{ producto: 'Molletes de Frijol', cantidad: 2, precio: 42 }],
  },
  {
    folio: 'CB-2411-0036',
    alumno: 'Karla Núñez',
    matricula: '23300095',
    estado: 'entregado',
    creadoEn: '2026-11-05T10:15:00',
    recogidaEn: '2026-11-05T10:45:00',
    metodo: 'tarjeta',
    notas: null,
    lineas: [{ producto: 'Bowl de Pollo', cantidad: 1, precio: 72 }],
  },
  {
    folio: 'CB-2411-0034',
    alumno: 'Pablo Rivas',
    matricula: '23300163',
    estado: 'cancelado',
    creadoEn: '2026-11-05T09:50:00',
    recogidaEn: '2026-11-05T10:20:00',
    metodo: 'efectivo',
    notas: null,
    lineas: [{ producto: 'Papas a la Francesa', cantidad: 1, precio: 32 }],
  },
];

export const totalOrden = (orden: OrdenNegocio): number =>
  orden.lineas.reduce((suma, linea) => suma + linea.precio * linea.cantidad, 0);

export const piezas = (orden: OrdenNegocio): number =>
  orden.lineas.reduce((suma, linea) => suma + linea.cantidad, 0);

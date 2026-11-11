// CL-Sprint5 11/11/2026: órdenes de demostración. Juntan los dos mocks que había (alumno/presentation/
// pedidos.mock.ts y menu-negocio/.../pedidos.mock.ts de JY-Sprint4) en una sola "tabla", con los estados
// reales de la BD: lo que el alumno ve en "Mis pedidos" y lo que la cafetería ve en su tablero son las
// mismas órdenes (la CB-2411-0042 de Juan aparece en los dos lados).
import {
  DEMO_ALUMNO,
  DEMO_CAFETERIA as C,
  DEMO_CAFETERIAS,
  DEMO_PRODUCTO as P,
  DEMO_PRODUCTOS,
  fotoDemo,
} from '@core/mock/demo-db';
import {
  EstadoOrden,
  EstadoPago,
  LineaOrden,
  MetodoPagoOrden,
  Orden,
  folioDe,
  totalLineas,
} from '@features/ordenes/domain/models/orden.model';

/** Una fila de la "tabla" del mock: la orden más quién la hizo (la API no se lo dice al alumno). */
export interface RegistroOrdenMock {
  idAlumno: string;
  orden: Orden;
}

/** Línea de un producto de la BD demo. */
export function lineaDemo(idProducto: string, cantidad: number): LineaOrden {
  const p = DEMO_PRODUCTOS.find((x) => x.id === idProducto);
  if (!p) throw new Error(`Producto demo desconocido: ${idProducto}`);
  return {
    idProducto,
    producto: p.nombre,
    cantidad,
    precioUnitario: p.precio,
    imagenUrl: fotoDemo(p.foto),
  };
}

/** El pago según el método y el estado, como lo dejan sp_crear_orden, sp_confirmar_pago y sp_entregar_orden. */
export function estadoPagoDe(metodo: MetodoPagoOrden, estado: EstadoOrden): EstadoPago {
  if (estado === 'cancelada') return 'cancelado';
  if (metodo === 'efectivo') return estado === 'entregada' ? 'pagado' : 'pendiente';
  return estado === 'pendiente' ? 'pendiente' : 'pagado';
}

/** CL-Sprint5 11/11/2026 (etapa 6): un producto que la cafetería ya retiró de su menú. */
const LINEA_RETIRADA: LineaOrden = {
  idProducto: '00000000-0000-4000-8000-0000000000f1',
  producto: 'Malteada de Vainilla',
  cantidad: 1,
  precioUnitario: 45,
  imagenUrl: null,
};

interface Semilla {
  /** Los 8 primeros hexadecimales del id: dan el folio (CB-2411-0042). */
  prefijo: string;
  idCafeteria: string;
  alumno: { id: string; nombre: string; matricula: string };
  estado: EstadoOrden;
  creadoEn: string;
  recogidaEn: string;
  metodo: MetodoPagoOrden;
  codigo: string;
  notas: string | null;
  lineas: LineaOrden[];
}

function aRegistro(s: Semilla): RegistroOrdenMock {
  const c = DEMO_CAFETERIAS.find((x) => x.id === s.idCafeteria)!;
  const idOrden = `${s.prefijo}-0000-4000-8000-000000000000`;
  return {
    idAlumno: s.alumno.id,
    orden: {
      idOrden,
      folio: folioDe(idOrden),
      idCafeteria: c.id,
      cafeteria: c.nombre,
      logoCafeteria: c.logo,
      puntoEntrega: c.puntoEntrega,
      alumno: { nombre: s.alumno.nombre, matricula: s.alumno.matricula },
      estado: s.estado,
      recogidaEn: s.recogidaEn,
      creadoEn: s.creadoEn,
      codigoRecogida: s.codigo,
      total: totalLineas(s.lineas),
      metodo: s.metodo,
      estadoPago: estadoPagoDe(s.metodo, s.estado),
      notas: s.notas,
      lineas: s.lineas,
    },
  };
}

const alumno = (id: string, nombre: string, matricula: string) => ({ id, nombre, matricula });
const JUAN = { ...DEMO_ALUMNO };
const otro = (n: number, nombre: string, matricula: string) =>
  alumno(`00000000-0000-0000-0000-0000000000b${n}`, nombre, matricula);

const SEMILLAS: Semilla[] = [
  // ---- Tablero de la cafetería del encargado (Cafetería Central) ----
  {
    prefijo: '24110045', idCafeteria: C.central, alumno: otro(1, 'Ana Ramírez', '23300118'),
    estado: 'confirmada', creadoEn: '2026-11-05T12:41:00-06:00', recogidaEn: '2026-11-05T13:15:00-06:00',
    metodo: 'efectivo', codigo: '381904', notas: 'Para llevar.',
    lineas: [lineaDemo(P.chilaquiles, 2), lineaDemo(P.americano, 2)],
  },
  {
    // Transferencia ya confirmada: por eso está "confirmada" y no "pendiente"
    prefijo: '24110044', idCafeteria: C.central, alumno: otro(2, 'Luis Ortega', '23300077'),
    estado: 'confirmada', creadoEn: '2026-11-05T12:38:00-06:00', recogidaEn: '2026-11-05T13:00:00-06:00',
    metodo: 'transferencia', codigo: '506127', notas: null,
    lineas: [lineaDemo(P.panini, 1)],
  },
  {
    prefijo: '24110042', idCafeteria: C.central, alumno: JUAN,
    estado: 'en_preparacion', creadoEn: '2026-11-05T12:05:00-06:00', recogidaEn: '2026-11-05T13:30:00-06:00',
    metodo: 'efectivo', codigo: '774210', notas: 'Sin cebolla, por favor.',
    lineas: [lineaDemo(P.sandwich, 1), lineaDemo(P.panini, 2)],
  },
  {
    prefijo: '24110040', idCafeteria: C.central, alumno: otro(3, 'Sofía Mendoza', '23300204'),
    estado: 'en_preparacion', creadoEn: '2026-11-05T11:52:00-06:00', recogidaEn: '2026-11-05T12:40:00-06:00',
    metodo: 'tarjeta', codigo: '219548', notas: null,
    lineas: [lineaDemo(P.ensalada, 1), lineaDemo(P.galletas, 1)],
  },
  {
    prefijo: '24110039', idCafeteria: C.central, alumno: otro(4, 'Diego Salas', '23300131'),
    estado: 'lista', creadoEn: '2026-11-05T11:30:00-06:00', recogidaEn: '2026-11-05T12:10:00-06:00',
    metodo: 'efectivo', codigo: '930476', notas: null,
    lineas: [lineaDemo(P.molletes, 2)],
  },
  {
    prefijo: '24110036', idCafeteria: C.central, alumno: otro(5, 'Karla Núñez', '23300095'),
    estado: 'entregada', creadoEn: '2026-11-05T10:15:00-06:00', recogidaEn: '2026-11-05T10:45:00-06:00',
    metodo: 'tarjeta', codigo: '118302', notas: null,
    lineas: [lineaDemo(P.bowlPollo, 1)],
  },
  {
    prefijo: '24110034', idCafeteria: C.central, alumno: otro(6, 'Pablo Rivas', '23300163'),
    estado: 'cancelada', creadoEn: '2026-11-05T09:50:00-06:00', recogidaEn: '2026-11-05T10:20:00-06:00',
    metodo: 'efectivo', codigo: '650881', notas: null,
    lineas: [lineaDemo(P.papas, 1)],
  },
  // ---- Resto de los pedidos de Juan (otras cafeterías) ----
  {
    prefijo: '24110041', idCafeteria: C.rincon, alumno: JUAN,
    estado: 'lista', creadoEn: '2026-11-05T11:10:00-06:00', recogidaEn: '2026-11-05T12:00:00-06:00',
    metodo: 'transferencia', codigo: '402719', notas: null,
    lineas: [lineaDemo(P.bowlPollo, 1)],
  },
  {
    prefijo: '24110038', idCafeteria: C.sabor, alumno: JUAN,
    estado: 'entregada', creadoEn: '2026-11-04T14:20:00-06:00', recogidaEn: '2026-11-04T15:00:00-06:00',
    metodo: 'tarjeta', codigo: '587330', notas: null,
    // La malteada ya no está en el menú: "Volver a pedir" avisa que no se pudo agregar
    lineas: [lineaDemo(P.hamburguesa, 1), LINEA_RETIRADA],
  },
  {
    prefijo: '24110035', idCafeteria: C.express, alumno: JUAN,
    estado: 'cancelada', creadoEn: '2026-11-03T09:40:00-06:00', recogidaEn: '2026-11-03T10:15:00-06:00',
    metodo: 'efectivo', codigo: '263145', notas: null,
    lineas: [lineaDemo(P.latte, 1)],
  },
];

export function ordenesDemo(): RegistroOrdenMock[] {
  return SEMILLAS.map(aRegistro);
}

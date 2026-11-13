// CL-Sprint5 13/11/2026: datos de PRUEBA de los repositorios falsos (data/mock de cada feature). Solo los
// importan los *.spec.ts: la app ya habla con el back real. Antes eran la "BD de demostración" compartida
// (core/mock/demo-db.ts, CL-Sprint5 11/11/2026); el horario y el cierre de hoy ya no se simulan: cada
// cafetería trae fijos `abierta` y `cierraA` (los que daba la demo un miércoles a mediodía).
import { MenuCafeteria, Promocion } from '@features/catalogo/domain/models/catalogo.model';

export type DemoMetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface DemoCafeteria {
  id: string;
  nombre: string;
  esDelCampus: boolean;
  puntoEntrega: string;
  metodosPago: DemoMetodoPago[];
  logo: string;
  portada: string;
  calificacion: number;
  /** Cuántas personas calificaron. */
  resenas: number;
  abierta: boolean;
  /** Hora de cierre de hoy (HH:mm), o null si hoy no abre. */
  cierraA: string | null;
  /** Tiempo típico de preparación, en minutos. */
  minutosEstimados: number;
}

export interface DemoProducto {
  id: string;
  idCafeteria: string;
  nombre: string;
  categoria: string;
  precio: number;
  descripcion: string;
  /** Archivo en public/assets/demo (sin extensión). Fuentes y licencia en el README de esa carpeta. */
  foto: string;
  calificacion: number;
  minutosPreparacion: number;
  /** Precio antes de la promoción; null si no está en promoción. */
  precioAnterior: number | null;
  /** Lo más pedido: sale en "Populares" del inicio. */
  popular: boolean;
  /** CL-Sprint5 11/11/2026 (etapa 4): para los filtros de dieta del buscador. */
  dietas: ('vegetariano' | 'sin_gluten')[];
}

/** Promoción destacada del carrusel del inicio. */
export interface DemoPromocion {
  id: string;
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  banner: string;
  /** A dónde lleva: una cafetería o una búsqueda por categoría. */
  idCafeteria: string | null;
  categoria: string | null;
}

export const DEMO_CAFETERIA = {
  central: '00000000-0000-0000-0000-0000000000c1',
  terraza: '00000000-0000-0000-0000-0000000000c2',
  rincon: '00000000-0000-0000-0000-0000000000c3',
  sabor: '00000000-0000-0000-0000-0000000000c4',
  express: '00000000-0000-0000-0000-0000000000c5',
  snack: '00000000-0000-0000-0000-0000000000c6',
} as const;

export const DEMO_PRODUCTO = {
  sandwich: '00000000-0000-0000-0000-0000000000e1',
  latte: '00000000-0000-0000-0000-0000000000e2',
  bowlPollo: '00000000-0000-0000-0000-0000000000e3',
  hamburguesa: '00000000-0000-0000-0000-0000000000e4',
  smoothie: '00000000-0000-0000-0000-0000000000e5',
  chilaquiles: '00000000-0000-0000-0000-0000000000e6',
  papas: '00000000-0000-0000-0000-0000000000e7',
  panini: '00000000-0000-0000-0000-0000000000e8',
  molletes: '00000000-0000-0000-0000-0000000000e9',
  ensalada: '00000000-0000-0000-0000-0000000000ea',
  americano: '00000000-0000-0000-0000-0000000000eb',
  galletas: '00000000-0000-0000-0000-0000000000ec',
} as const;

/** El alumno de la demo: sus pedidos son los que ve "Mis pedidos" con el mock. */
export const DEMO_ALUMNO = {
  id: '00000000-0000-0000-0000-0000000000a1',
  nombre: 'Juan Pérez',
  matricula: '23300022',
} as const;

/** La cafetería que "atiende" el encargado en la demo del tablero de pedidos. */
export const DEMO_CAFETERIA_ENCARGADO = DEMO_CAFETERIA.central;

const C = DEMO_CAFETERIA;
const P = DEMO_PRODUCTO;

const cafeteria = (
  id: string,
  nombre: string,
  archivo: string,
  datos: Omit<DemoCafeteria, 'id' | 'nombre' | 'logo' | 'portada'>,
): DemoCafeteria => ({
  id,
  nombre,
  logo: `assets/demo/logo-${archivo}.webp`,
  portada: `assets/demo/portada-${archivo}.webp`,
  ...datos,
});

export const DEMO_CAFETERIAS: DemoCafeteria[] = [
  cafeteria(C.central, 'Cafetería Central', 'central', {
    esDelCampus: true,
    puntoEntrega: 'Barra principal, Edificio A',
    metodosPago: ['efectivo', 'tarjeta', 'transferencia'],
    calificacion: 4.8,
    resenas: 312,
    abierta: true,
    cierraA: '17:00',
    minutosEstimados: 10,
  }),
  cafeteria(C.express, 'Café Express', 'express', {
    esDelCampus: false,
    puntoEntrega: 'Kiosco, Entrada norte',
    metodosPago: ['efectivo', 'tarjeta'],
    calificacion: 4.7,
    resenas: 189,
    abierta: false,
    cierraA: null,
    minutosEstimados: 5,
  }),
  cafeteria(C.rincon, 'Rincón Verde', 'rincon', {
    esDelCampus: true,
    puntoEntrega: 'Mostrador, Patio central',
    metodosPago: ['efectivo', 'transferencia'],
    calificacion: 4.9,
    resenas: 141,
    abierta: true,
    cierraA: '16:00',
    minutosEstimados: 12,
  }),
  cafeteria(C.sabor, 'Sabor Universitario', 'sabor', {
    esDelCampus: true,
    puntoEntrega: 'Barra 2, Comedor',
    metodosPago: ['efectivo', 'tarjeta'],
    calificacion: 4.6,
    resenas: 256,
    abierta: true,
    cierraA: '18:00',
    minutosEstimados: 15,
  }),
  cafeteria(C.terraza, 'La Terraza', 'terraza', {
    esDelCampus: true,
    puntoEntrega: 'Terraza, Edificio C',
    metodosPago: ['efectivo'],
    calificacion: 4.6,
    resenas: 98,
    abierta: true,
    cierraA: '13:00',
    minutosEstimados: 12,
  }),
  cafeteria(C.snack, 'Snack Point', 'snack', {
    esDelCampus: false,
    puntoEntrega: 'Local 4, Plaza estudiantil',
    metodosPago: ['efectivo', 'transferencia'],
    calificacion: 4.5,
    resenas: 74,
    abierta: true,
    cierraA: '19:00',
    minutosEstimados: 6,
  }),
];

export const DEMO_PRODUCTOS: DemoProducto[] = [
  { id: P.sandwich, idCafeteria: C.central, nombre: 'Sándwich Clásico de Pollo', categoria: 'Comidas', precio: 55, foto: 'sandwich', calificacion: 4.8, minutosPreparacion: 8, precioAnterior: null, popular: true, dietas: [],
    descripcion: 'Pan artesanal, pollo, lechuga, jitomate y aderezo de la casa.' },
  { id: P.panini, idCafeteria: C.central, nombre: 'Panini Caprese', categoria: 'Comidas', precio: 49, foto: 'panini', calificacion: 4.7, minutosPreparacion: 8, precioAnterior: 59, popular: true, dietas: ['vegetariano'],
    descripcion: 'Pan artesanal, mozzarella, jitomate, albahaca y pesto.' },
  { id: P.latte, idCafeteria: C.express, nombre: 'Latte Helado', categoria: 'Bebidas', precio: 38, foto: 'latte', calificacion: 4.7, minutosPreparacion: 4, precioAnterior: null, popular: true, dietas: ['vegetariano', 'sin_gluten'],
    descripcion: 'Café espresso con leche y hielo. 355 ml.' },
  { id: P.americano, idCafeteria: C.express, nombre: 'Café Americano', categoria: 'Bebidas', precio: 28, foto: 'americano', calificacion: 4.6, minutosPreparacion: 3, precioAnterior: null, popular: false, dietas: ['vegetariano', 'sin_gluten'],
    descripcion: 'Café de grano recién molido. 355 ml.' },
  { id: P.bowlPollo, idCafeteria: C.rincon, nombre: 'Bowl de Pollo', categoria: 'Saludable', precio: 72, foto: 'bowl-pollo', calificacion: 4.9, minutosPreparacion: 12, precioAnterior: null, popular: true, dietas: ['sin_gluten'],
    descripcion: 'Arroz integral, pollo a la plancha, aguacate, vegetales y aderezo.' },
  { id: P.smoothie, idCafeteria: C.rincon, nombre: 'Smoothie de Frutos Rojos', categoria: 'Bebidas', precio: 45, foto: 'smoothie', calificacion: 4.8, minutosPreparacion: 5, precioAnterior: null, popular: false, dietas: ['vegetariano', 'sin_gluten'],
    descripcion: 'Fresa, plátano, avena y yogurt.' },
  { id: P.ensalada, idCafeteria: C.rincon, nombre: 'Ensalada César', categoria: 'Saludable', precio: 62, foto: 'ensalada-cesar', calificacion: 4.5, minutosPreparacion: 7, precioAnterior: null, popular: false, dietas: [],
    descripcion: 'Lechuga romana, crutones, parmesano y aderezo césar.' },
  { id: P.hamburguesa, idCafeteria: C.sabor, nombre: 'Hamburguesa Clásica', categoria: 'Comidas', precio: 79, foto: 'hamburguesa', calificacion: 4.6, minutosPreparacion: 15, precioAnterior: 89, popular: true, dietas: [],
    descripcion: 'Carne de res, queso, lechuga, jitomate y papas.' },
  { id: P.chilaquiles, idCafeteria: C.terraza, nombre: 'Chilaquiles Verdes', categoria: 'Desayunos', precio: 58, foto: 'chilaquiles', calificacion: 4.6, minutosPreparacion: 10, precioAnterior: null, popular: true, dietas: ['sin_gluten'],
    descripcion: 'Con pollo, crema, queso y cebolla.' },
  { id: P.molletes, idCafeteria: C.terraza, nombre: 'Molletes de Frijol', categoria: 'Desayunos', precio: 42, foto: 'molletes', calificacion: 4.4, minutosPreparacion: 8, precioAnterior: null, popular: false, dietas: ['vegetariano'],
    descripcion: 'Pan bolillo, frijoles refritos, queso gratinado y pico de gallo.' },
  { id: P.papas, idCafeteria: C.snack, nombre: 'Papas a la Francesa', categoria: 'Snacks', precio: 32, foto: 'papas', calificacion: 4.5, minutosPreparacion: 6, precioAnterior: null, popular: true, dietas: ['vegetariano', 'sin_gluten'],
    descripcion: 'Papas crujientes con aderezo de la casa.' },
  { id: P.galletas, idCafeteria: C.snack, nombre: 'Galletas de Avena', categoria: 'Snacks', precio: 25, foto: 'galletas', calificacion: 4.3, minutosPreparacion: 1, precioAnterior: null, popular: false, dietas: ['vegetariano'],
    descripcion: 'Paquete de 3 piezas, hechas en casa.' },
];

/** CL-Sprint5 11/11/2026: promociones del carrusel del inicio (etapa 3). */
export const DEMO_PROMOCIONES: DemoPromocion[] = [
  {
    id: 'promo-receso',
    etiqueta: 'Receso de 20 min',
    titulo: 'Pide ahora, recoge sin fila',
    subtitulo: 'Bebidas listas en 5 minutos o menos',
    banner: 'assets/demo/banner-receso.webp',
    idCafeteria: null,
    categoria: 'Bebidas',
  },
  {
    id: 'promo-combo',
    etiqueta: 'Combo estudiante',
    titulo: 'Panini Caprese a $49',
    subtitulo: 'Antes $59 · Cafetería Central',
    banner: 'assets/demo/banner-combo.webp',
    idCafeteria: C.central,
    categoria: null,
  },
  {
    id: 'promo-desayunos',
    etiqueta: 'Hasta las 10:00',
    titulo: 'Desayunos para empezar bien',
    subtitulo: 'Chilaquiles, molletes y más',
    banner: 'assets/demo/banner-desayunos.webp',
    idCafeteria: null,
    categoria: 'Desayunos',
  },
];

/**
 * CL-Sprint5 11/11/2026: URL de la foto de un producto demo. Son fotos reales de cada platillo (Unsplash,
 * licencia libre) guardadas en public/assets/demo como WebP de 640×480; el navegador las escala.
 */
export function fotoDemo(foto: string): string {
  return `assets/demo/${foto}.webp`;
}

/** El menú de prueba con la forma de GET api/menu. */
export function menuDemo(): MenuCafeteria[] {
  return DEMO_CAFETERIAS.map((c) => ({
    idCafeteria: c.id,
    cafeteria: c.nombre,
    esDelCampus: c.esDelCampus,
    puntoEntrega: c.puntoEntrega,
    metodosPago: [...c.metodosPago],
    productos: DEMO_PRODUCTOS.filter((p) => p.idCafeteria === c.id).map((p) => ({
      idProducto: p.id,
      producto: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion,
      precio: p.precio,
      imagenUrl: fotoDemo(p.foto),
      calificacion: p.calificacion,
      minutosPreparacion: p.minutosPreparacion,
      precioAnterior: p.precioAnterior,
      popular: p.popular,
      dietas: [...p.dietas],
    })),
    logoUrl: c.logo,
    portadaUrl: c.portada,
    calificacion: c.calificacion,
    resenas: c.resenas,
    abierta: c.abierta,
    cierraA: c.cierraA,
    minutosEstimados: c.minutosEstimados,
  }));
}

/** Las promociones de prueba con la forma de GET api/promociones/activas. */
export function promocionesDemo(): Promocion[] {
  return DEMO_PROMOCIONES.map((p) => ({
    idPromocion: p.id,
    etiqueta: p.etiqueta,
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    imagenUrl: p.banner,
    idCafeteria: p.idCafeteria,
    categoria: p.categoria,
  }));
}

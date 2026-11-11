// CL-Sprint5 11/11/2026: "base de datos" de demostración que comparten los repositorios mock de varias
// features (catálogo, órdenes, favoritos). Así hablan de las mismas cafeterías y productos, como lo harían
// con el backend. Son datos planos (sin tipos de las features): cada mock los convierte a su dominio.
// Fotos de platillos: Unsplash (ver public/assets/demo/README.md). Portadas y logos de cafeterías: Picsum
// Photos (stock genérico, no son fotos reales de la UTTT ni de sus cafeterías).

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
  abierta: boolean;
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
  semilla: string,
  datos: Omit<DemoCafeteria, 'id' | 'nombre' | 'logo' | 'portada'>,
): DemoCafeteria => ({
  id,
  nombre,
  logo: `https://picsum.photos/seed/cb-logo-${semilla}/80/80`,
  portada: `https://picsum.photos/seed/cb-dest-${semilla}/320/200`,
  ...datos,
});

export const DEMO_CAFETERIAS: DemoCafeteria[] = [
  cafeteria(C.central, 'Cafetería Central', 'central', {
    esDelCampus: true,
    puntoEntrega: 'Barra principal, Edificio A',
    metodosPago: ['efectivo', 'tarjeta', 'transferencia'],
    calificacion: 4.8,
    abierta: true,
  }),
  cafeteria(C.express, 'Café Express', 'express', {
    esDelCampus: false,
    puntoEntrega: 'Kiosco, Entrada norte',
    metodosPago: ['efectivo', 'tarjeta'],
    calificacion: 4.7,
    abierta: false,
  }),
  cafeteria(C.rincon, 'Rincón Verde', 'rincon', {
    esDelCampus: true,
    puntoEntrega: 'Mostrador, Patio central',
    metodosPago: ['efectivo', 'transferencia'],
    calificacion: 4.9,
    abierta: true,
  }),
  cafeteria(C.sabor, 'Sabor Universitario', 'sabor', {
    esDelCampus: true,
    puntoEntrega: 'Barra 2, Comedor',
    metodosPago: ['efectivo', 'tarjeta'],
    calificacion: 4.6,
    abierta: true,
  }),
  cafeteria(C.terraza, 'La Terraza', 'terraza', {
    esDelCampus: true,
    puntoEntrega: 'Terraza, Edificio C',
    metodosPago: ['efectivo'],
    calificacion: 4.6,
    abierta: true,
  }),
  cafeteria(C.snack, 'Snack Point', 'snack', {
    esDelCampus: false,
    puntoEntrega: 'Local 4, Plaza estudiantil',
    metodosPago: ['efectivo', 'transferencia'],
    calificacion: 4.5,
    abierta: true,
  }),
];

export const DEMO_PRODUCTOS: DemoProducto[] = [
  { id: P.sandwich, idCafeteria: C.central, nombre: 'Sándwich Clásico de Pollo', categoria: 'Comidas', precio: 55, foto: 'sandwich',
    descripcion: 'Pan artesanal, pollo, lechuga, jitomate y aderezo de la casa.' },
  { id: P.panini, idCafeteria: C.central, nombre: 'Panini Caprese', categoria: 'Comidas', precio: 49, foto: 'panini',
    descripcion: 'Pan artesanal, mozzarella, jitomate, albahaca y pesto.' },
  { id: P.latte, idCafeteria: C.express, nombre: 'Latte Helado', categoria: 'Bebidas', precio: 38, foto: 'latte',
    descripcion: 'Café espresso con leche y hielo. 355 ml.' },
  { id: P.americano, idCafeteria: C.express, nombre: 'Café Americano', categoria: 'Bebidas', precio: 28, foto: 'americano',
    descripcion: 'Café de grano recién molido. 355 ml.' },
  { id: P.bowlPollo, idCafeteria: C.rincon, nombre: 'Bowl de Pollo', categoria: 'Saludable', precio: 72, foto: 'bowl-pollo',
    descripcion: 'Arroz integral, pollo a la plancha, aguacate, vegetales y aderezo.' },
  { id: P.smoothie, idCafeteria: C.rincon, nombre: 'Smoothie de Frutos Rojos', categoria: 'Bebidas', precio: 45, foto: 'smoothie',
    descripcion: 'Fresa, plátano, avena y yogurt.' },
  { id: P.ensalada, idCafeteria: C.rincon, nombre: 'Ensalada César', categoria: 'Saludable', precio: 62, foto: 'ensalada-cesar',
    descripcion: 'Lechuga romana, crutones, parmesano y aderezo césar.' },
  { id: P.hamburguesa, idCafeteria: C.sabor, nombre: 'Hamburguesa Clásica', categoria: 'Comidas', precio: 79, foto: 'hamburguesa',
    descripcion: 'Carne de res, queso, lechuga, jitomate y papas.' },
  { id: P.chilaquiles, idCafeteria: C.terraza, nombre: 'Chilaquiles Verdes', categoria: 'Desayunos', precio: 58, foto: 'chilaquiles',
    descripcion: 'Con pollo, crema, queso y cebolla.' },
  { id: P.molletes, idCafeteria: C.terraza, nombre: 'Molletes de Frijol', categoria: 'Desayunos', precio: 42, foto: 'molletes',
    descripcion: 'Pan bolillo, frijoles refritos, queso gratinado y pico de gallo.' },
  { id: P.papas, idCafeteria: C.snack, nombre: 'Papas a la Francesa', categoria: 'Snacks', precio: 32, foto: 'papas',
    descripcion: 'Papas crujientes con aderezo de la casa.' },
  { id: P.galletas, idCafeteria: C.snack, nombre: 'Galletas de Avena', categoria: 'Snacks', precio: 25, foto: 'galletas',
    descripcion: 'Paquete de 3 piezas, hechas en casa.' },
];

/**
 * CL-Sprint5 11/11/2026: URL de la foto de un producto demo. Son fotos reales de cada platillo (Unsplash,
 * licencia libre) guardadas en public/assets/demo como WebP de 640×480; el navegador las escala.
 */
export function fotoDemo(foto: string): string {
  return `assets/demo/${foto}.webp`;
}

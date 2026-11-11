// JY-Sprint4 05/11/2026: cascarón visual. Catálogo fijo para /buscar y /favoritos mientras el back no
// expone búsqueda ni favoritos. Las fotos son de Picsum Photos (stock genérico, no fotos reales de la UTTT).
// Al conectar la HU este archivo se borra y las pantallas leen del MenuService.

export interface PlatilloCatalogo {
  idProducto: string;
  producto: string;
  descripcion: string;
  categoria: string;
  precio: number;
  foto: string;
  idCafeteria: string;
  cafeteria: string;
  calificacion: number;
}

export const CATEGORIAS = [
  'Todos',
  'Desayunos',
  'Comidas',
  'Bebidas',
  'Snacks',
  'Saludable',
] as const;

export const CAFETERIAS = [
  'Todas',
  'Cafetería Central',
  'La Terraza',
  'Rincón Verde',
  'Sabor Universitario',
  'Café Express',
  'Snack Point',
] as const;

// Ids con forma de UUID para que el carrito se comporte igual que con datos del back
const CAF = {
  central: '00000000-0000-0000-0000-0000000000c1',
  terraza: '00000000-0000-0000-0000-0000000000c2',
  rincon: '00000000-0000-0000-0000-0000000000c3',
  sabor: '00000000-0000-0000-0000-0000000000c4',
  express: '00000000-0000-0000-0000-0000000000c5',
  snack: '00000000-0000-0000-0000-0000000000c6',
};

export const CATALOGO: PlatilloCatalogo[] = [
  {
    idProducto: '00000000-0000-0000-0000-0000000000e1',
    producto: 'Sándwich Clásico de Pollo',
    descripcion: 'Pan artesanal, pollo, lechuga, jitomate y aderezo de la casa.',
    categoria: 'Comidas',
    precio: 55,
    foto: 'https://picsum.photos/seed/cb-menu-sandwich/480/360',
    idCafeteria: CAF.central,
    cafeteria: 'Cafetería Central',
    calificacion: 4.8,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e2',
    producto: 'Latte Helado',
    descripcion: 'Café espresso con leche y hielo. 355 ml.',
    categoria: 'Bebidas',
    precio: 38,
    foto: 'https://picsum.photos/seed/cb-menu-latte/480/360',
    idCafeteria: CAF.express,
    cafeteria: 'Café Express',
    calificacion: 4.7,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e3',
    producto: 'Bowl de Pollo',
    descripcion: 'Arroz integral, pollo a la plancha, aguacate, vegetales y aderezo.',
    categoria: 'Saludable',
    precio: 72,
    foto: 'https://picsum.photos/seed/cb-menu-bowlpollo/480/360',
    idCafeteria: CAF.rincon,
    cafeteria: 'Rincón Verde',
    calificacion: 4.9,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e4',
    producto: 'Hamburguesa Clásica',
    descripcion: 'Carne de res, queso, lechuga, jitomate y papas.',
    categoria: 'Comidas',
    precio: 79,
    foto: 'https://picsum.photos/seed/cb-menu-hamburguesa/480/360',
    idCafeteria: CAF.sabor,
    cafeteria: 'Sabor Universitario',
    calificacion: 4.6,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e5',
    producto: 'Smoothie de Frutos Rojos',
    descripcion: 'Fresa, plátano, avena y yogurt.',
    categoria: 'Bebidas',
    precio: 45,
    foto: 'https://picsum.photos/seed/cb-menu-smoothie/480/360',
    idCafeteria: CAF.rincon,
    cafeteria: 'Rincón Verde',
    calificacion: 4.8,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e6',
    producto: 'Chilaquiles Verdes',
    descripcion: 'Con pollo, crema, queso y cebolla.',
    categoria: 'Desayunos',
    precio: 58,
    foto: 'https://picsum.photos/seed/cb-menu-chilaquiles/480/360',
    idCafeteria: CAF.terraza,
    cafeteria: 'La Terraza',
    calificacion: 4.6,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e7',
    producto: 'Papas a la Francesa',
    descripcion: 'Papas crujientes con aderezo de la casa.',
    categoria: 'Snacks',
    precio: 32,
    foto: 'https://picsum.photos/seed/cb-menu-papas/480/360',
    idCafeteria: CAF.snack,
    cafeteria: 'Snack Point',
    calificacion: 4.5,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e8',
    producto: 'Panini Caprese',
    descripcion: 'Pan artesanal, mozzarella, jitomate, albahaca y pesto.',
    categoria: 'Comidas',
    precio: 49,
    foto: 'https://picsum.photos/seed/cb-menu-panini/480/360',
    idCafeteria: CAF.central,
    cafeteria: 'Cafetería Central',
    calificacion: 4.7,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000e9',
    producto: 'Molletes de Frijol',
    descripcion: 'Pan bolillo, frijoles refritos, queso gratinado y pico de gallo.',
    categoria: 'Desayunos',
    precio: 42,
    foto: 'https://picsum.photos/seed/cb-menu-molletes/480/360',
    idCafeteria: CAF.terraza,
    cafeteria: 'La Terraza',
    calificacion: 4.4,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000ea',
    producto: 'Ensalada César',
    descripcion: 'Lechuga romana, crutones, parmesano y aderezo césar.',
    categoria: 'Saludable',
    precio: 62,
    foto: 'https://picsum.photos/seed/cb-menu-cesar/480/360',
    idCafeteria: CAF.rincon,
    cafeteria: 'Rincón Verde',
    calificacion: 4.5,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000eb',
    producto: 'Café Americano',
    descripcion: 'Café de grano recién molido. 355 ml.',
    categoria: 'Bebidas',
    precio: 28,
    foto: 'https://picsum.photos/seed/cb-menu-americano/480/360',
    idCafeteria: CAF.express,
    cafeteria: 'Café Express',
    calificacion: 4.6,
  },
  {
    idProducto: '00000000-0000-0000-0000-0000000000ec',
    producto: 'Galletas de Avena',
    descripcion: 'Paquete de 3 piezas, hechas en casa.',
    categoria: 'Snacks',
    precio: 25,
    foto: 'https://picsum.photos/seed/cb-menu-galletas/480/360',
    idCafeteria: CAF.snack,
    cafeteria: 'Snack Point',
    calificacion: 4.3,
  },
];

export interface CafeteriaFavorita {
  idCafeteria: string;
  nombre: string;
  foto: string;
  calificacion: number;
  puntoEntrega: string;
  esDelCampus: boolean;
  abierta: boolean;
  platillos: number;
}

export const FAVORITAS: CafeteriaFavorita[] = [
  {
    idCafeteria: CAF.central,
    nombre: 'Cafetería Central',
    foto: 'https://picsum.photos/seed/cb-dest-central/320/200',
    calificacion: 4.8,
    puntoEntrega: 'Barra principal, Edificio A',
    esDelCampus: true,
    abierta: true,
    platillos: 24,
  },
  {
    idCafeteria: CAF.rincon,
    nombre: 'Rincón Verde',
    foto: 'https://picsum.photos/seed/cb-dest-rincon/320/200',
    calificacion: 4.9,
    puntoEntrega: 'Mostrador, Patio central',
    esDelCampus: true,
    abierta: true,
    platillos: 18,
  },
  {
    idCafeteria: CAF.express,
    nombre: 'Café Express',
    foto: 'https://picsum.photos/seed/cb-dest-express/320/200',
    calificacion: 4.7,
    puntoEntrega: 'Kiosco, Entrada norte',
    esDelCampus: false,
    abierta: false,
    platillos: 11,
  },
];

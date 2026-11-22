import type { ApiSimulada } from './fixtures';
import { CAFETERIA_ID } from './jwt';

// Respuestas de ejemplo con la forma EXACTA de los DTOs del back (camelCase). Si el back cambia un contrato, estos
// objetos son los que hay que actualizar, y las pruebas dejan de pasar donde el front lea mal el campo.

export const ID_DESAYUNOS = '00000000-0000-0000-0000-0000000000d1';
export const ID_BEBIDAS = '00000000-0000-0000-0000-0000000000d2';

export const categorias = [
  { idCategoria: ID_DESAYUNOS, nombre: 'Desayunos' },
  { idCategoria: ID_BEBIDAS, nombre: 'Bebidas' },
];

export function producto(extra: Partial<ProductoApi> = {}): ProductoApi {
  return {
    idProducto: '00000000-0000-0000-0000-0000000000e1',
    idCafeteria: CAFETERIA_ID,
    idCategoria: ID_DESAYUNOS,
    categoria: 'Desayunos',
    nombre: 'Chilaquiles verdes',
    descripcion: 'Con pollo y crema',
    precio: 55,
    imagenUrl: null,
    disponible: true,
    creadoEn: '2026-11-13T22:31:42.059586+00:00',
    actualizadoEn: '2026-11-13T22:31:42.059586+00:00',
    ...extra,
  };
}

export interface ProductoApi {
  idProducto: string;
  idCafeteria: string;
  idCategoria: string | null;
  categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  disponible: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/** Página de productos como la devuelve GET /api/cafeterias/{id}/productos. */
export function pagina(items: ProductoApi[], extra: Record<string, unknown> = {}) {
  return {
    items, total: items.length, pagina: 1, tamanoPagina: 100, totalPaginas: items.length ? 1 : 0,
    tieneAnterior: false, tieneSiguiente: false, ...extra,
  };
}

/** Los dos platillos de producción que se veían con categoría nula (el caso que rompió el panel del dueño). */
export const productosSinCategoria = [
  producto({
    idProducto: '11d06e2f-5260-4d9a-b738-d870b085bc02', idCategoria: null, categoria: null,
    nombre: 'Chilorta', descripcion: 'torta de chilaquiles', precio: 50,
  }),
  producto({
    idProducto: 'a3a84326-8406-485f-bfa8-d4bca5ec5aa8', idCategoria: null, categoria: null,
    nombre: 'torta', descripcion: 'torta con ensalada rusa', precio: 20,
  }),
];

/** GET /api/menu del alumno (MenuCafeteriaDto[]). */
export function menuCafeteria(extra: Record<string, unknown> = {}) {
  return {
    idCafeteria: CAFETERIA_ID,
    cafeteria: 'Cafetería Central',
    esDelCampus: true,
    puntoEntrega: 'Barra principal',
    metodosPago: ['Efectivo', 'Tarjeta'],
    productos: [
      {
        idProducto: 'p-1', producto: 'Chilaquiles Verdes con Pollo', categoria: 'Desayunos', descripcion: 'Con crema',
        precio: 55, imagenUrl: null, calificacion: null, minutosPreparacion: 10, precioAnterior: null,
        popular: true, dietas: [],
      },
      {
        idProducto: 'p-2', producto: 'Café Americano', categoria: 'Bebidas', descripcion: null,
        precio: 25, imagenUrl: null, calificacion: null, minutosPreparacion: 5, precioAnterior: null,
        popular: false, dietas: ['Vegetariano'],
      },
    ],
    logoUrl: null, portadaUrl: null, calificacion: null, resenas: null,
    abierta: true, cierraA: '20:00', minutosEstimados: 10,
    ...extra,
  };
}

/** Perfil del alumno (GET /api/alumnos/me/perfil). */
export function perfilAlumno(extra: Record<string, unknown> = {}) {
  return {
    correo: 'alumno@ejemplo.test',
    datos: { nombre: 'Alumno de Prueba', matricula: 'UTT0000001', telefono: '7710000001' },
    preferencias: { idCafeteriaFrecuente: null, metodoPago: 'Efectivo', avisoPedidoListo: true, avisoPromociones: false },
    ...extra,
  };
}

export const paginaVacia = { items: [], total: 0, pagina: 1, tamanoPagina: 50, totalPaginas: 0, tieneAnterior: false, tieneSiguiente: false };

/** Lo que la pantalla del alumno pide al abrir cualquier página (layout, pedidos, favoritos y perfil), vacío. */
export function simularAlumno(api: ApiSimulada): void {
  api.get('ordenes/mias', { body: paginaVacia });
  api.get('favoritos/cafeterias', { body: [] });
  api.get('favoritos/platillos', { body: [] });
  api.get('alumnos/me/perfil', { body: perfilAlumno() });
  api.get('promociones/activas', { body: [] });
}

/** CL-Sprint5 11/11/2026: una cafetería que el alumno guardó en favoritos (antes en catalogo.mock.ts de JY-Sprint4). */
export interface CafeteriaFavorita {
  idCafeteria: string;
  nombre: string;
  foto: string;
  calificacion: number;
  puntoEntrega: string;
  esDelCampus: boolean;
  abierta: boolean;
  /** Cuántos platillos tiene su menú. */
  platillos: number;
}

/**
 * CL-Sprint5 11/11/2026 (etapa 7): un platillo guardado en favoritos. Trae los datos de cuando se guardó
 * para poder mostrarlo aunque la cafetería ya lo haya quitado de su menú (`disponible: false`).
 */
export interface PlatilloFavorito {
  idProducto: string;
  producto: string;
  precio: number;
  imagenUrl: string | null;
  idCafeteria: string;
  cafeteria: string;
  /** Sigue en el menú de su cafetería. */
  disponible: boolean;
  /** Su cafetería está abierta ahora. */
  cafeteriaAbierta: boolean;
}

/** CL-Sprint5 11/11/2026 (etapa 7): las dos clases de favoritos (las pestañas de la pantalla). */
export type TipoFavorito = 'platillo' | 'cafeteria';

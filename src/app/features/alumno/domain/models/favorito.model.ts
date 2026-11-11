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

/**
 * CL-Sprint5 13/11/2026: contratos del perfil y los favoritos del alumno, verificados contra AlumnoDtos.cs
 * del back (PR #38). Enums como texto PascalCase.
 */

/** Enum `MetodoPago` del back. */
export type MetodoPagoDto = 'Efectivo' | 'Tarjeta' | 'Transferencia';

/** Response de GET y request/response de PUT api/alumnos/me/perfil. */
export interface DatosAlumnoDto {
  /** 2..80 */
  nombre: string;
  /** ≤ 20; 409 si ya la usa otra cuenta. */
  matricula: string | null;
  /** ^[0-9+]{10,15}$ */
  telefono: string | null;
}

/** Response de GET y request/response de PUT api/alumnos/me/preferencias. */
export interface PreferenciasAlumnoDto {
  idCafeteriaFrecuente: string | null;
  metodoPago: MetodoPagoDto | null;
  avisoPedidoListo: boolean;
  avisoPromociones: boolean;
}

/** GET api/alumnos/me/perfil */
export interface PerfilAlumnoDto {
  correo: string;
  datos: DatosAlumnoDto;
  preferencias: PreferenciasAlumnoDto;
}

/** GET api/favoritos/cafeterias (y respuesta del PUT). */
export interface FavoritoCafeteriaDto {
  idCafeteria: string;
  nombre: string;
  /** Llega en null mientras no haya endpoint para subir la portada. */
  foto: string | null;
  /** Llega en null mientras no haya reseñas. */
  calificacion: number | null;
  puntoEntrega: string;
  esDelCampus: boolean;
  abierta: boolean;
  platillos: number;
}

/** GET api/favoritos/platillos (y respuesta del PUT). */
export interface FavoritoPlatilloDto {
  idProducto: string;
  producto: string;
  precio: number;
  imagenUrl: string | null;
  idCafeteria: string;
  cafeteria: string;
  disponible: boolean;
  cafeteriaAbierta: boolean;
}

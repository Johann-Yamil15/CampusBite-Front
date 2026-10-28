/**
 * CL-Sprint4 28/10/2026: HU-07B. Forma EXACTA del contrato de productos y categorías del backend .NET
 * (System.Text.Json → camelCase). Fuente: CampusBite-Back/src/CampusBite.Api/Productos y
 * src/CampusBite.Application/Productos/Dtos (TEC-09 y TEC-10). Ajustar si cambia el API.
 */

/** Respuesta de `GET .../productos` (arreglo) y de `POST .../productos` (201). */
export interface ProductoDto {
  /** GUID. */
  idProducto: string;
  idCafeteria: string;
  idCategoria: string | null;
  /** Nombre de la categoría, o `null`. */
  categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  disponible: boolean;
  /** Fecha ISO-8601 con zona. */
  creadoEn: string;
  /** Fecha ISO-8601 con zona. */
  actualizadoEn: string;
}

/**
 * Body JSON de `PUT .../productos/{id}` (204). El alta (`POST`) usa los mismos campos pero como
 * multipart/form-data, más `archivo` (la imagen, opcional). Validaciones del backend entre paréntesis.
 */
export interface GuardarProductoRequestDto {
  /** Requerido (2–100). Único en la cafetería sin distinguir mayúsculas. */
  nombre: string;
  /** Opcional (máx. 500). En blanco se guarda `null`. */
  descripcion: string | null;
  /** Requerido: mayor a 0, menor a 1,000,000, máx. 2 decimales. */
  precio: number;
  /** Opcional; una categoría de ESA cafetería. */
  idCategoria: string | null;
  /** Si se omite el backend usa `true`: mandarlo siempre. */
  disponible: boolean;
}

/** Respuesta de `GET .../categorias`. */
export interface CategoriaDto {
  idCategoria: string;
  nombre: string;
}

/** Respuesta de `POST .../productos/{id}/imagen` (200). */
export interface ImagenProductoDto {
  imagenUrl: string;
}

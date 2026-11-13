/**
 * CL-Sprint4 28/10/2026: HU-07B. Entidades del menú que administra el encargado de una cafetería,
 * independientes de cómo las devuelva el API (TEC-09 / TEC-10).
 */

/** Límites del backend (`GuardarProductoDto` y tabla `producto`), para las validaciones del formulario. */
export const PRODUCT_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  descriptionMax: 500,
  /** NUMERIC(8,2): mayor a 0 y hasta 999,999.99, con máximo 2 decimales. */
  priceMax: 999_999.99,
} as const;

/** Reglas de imagen del backend (`ReglasImagenProducto`): JPEG, PNG o WebP de hasta 5 MB. */
export const PRODUCT_IMAGE_RULES = {
  maxBytes: 5 * 1024 * 1024,
  maxLabel: '5 MB',
  // "image/jpg" no es estándar pero lo mandan algunos celulares; el backend también lo acepta
  types: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  /** Valor para `<input type="file" accept>`. */
  accept: 'image/jpeg,image/png,image/webp',
} as const;

export interface Category {
  id: string;
  name: string;
}

export interface MenuProduct {
  id: string;
  cafeteriaId: string;
  categoryId: string | null;
  /** Nombre de la categoría, o `null` si no tiene. */
  categoryName: string | null;
  name: string;
  description: string | null;
  price: number;
  /** URL pública de la imagen, o `null` si no tiene. */
  imageUrl: string | null;
  /** `false` = no aparece en el menú del alumno (el encargado lo sigue viendo). */
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Datos para crear o editar un producto (mismo cuerpo en alta y edición; la imagen va aparte). */
export interface ProductData {
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  /** Se manda siempre: si el PUT lo omite, el backend lo vuelve a `true`. */
  available: boolean;
}

/**
 * Revisa una imagen antes de subirla (mismas reglas que el backend, que de todos modos la vuelve a validar).
 * @returns El mensaje de error, o `null` si la imagen se puede subir.
 */
export function validateProductImage(file: Pick<File, 'type' | 'size'>): string | null {
  if (!(PRODUCT_IMAGE_RULES.types as readonly string[]).includes(file.type)) {
    return 'Solo se aceptan imágenes JPEG, PNG o WebP.';
  }
  if (file.size <= 0) return 'El archivo está vacío.';
  if (file.size > PRODUCT_IMAGE_RULES.maxBytes) {
    return `La imagen pesa más de ${PRODUCT_IMAGE_RULES.maxLabel}. Redúcela e intenta de nuevo.`;
  }
  return null;
}

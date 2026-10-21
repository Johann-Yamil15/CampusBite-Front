/** CL-Sprint3 20/10/2026: entidades de cafeterías, independientes de cómo las devuelva el API. */

/** Métodos de pago que acepta el backend (en el orden en que los devuelve). Útil para pintar los checkboxes. */
export const PAYMENT_METHODS = ['Tarjeta', 'Transferencia', 'Efectivo'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Límites de longitud del backend (`GuardarCafeteriaDto`), para las validaciones del formulario. */
export const CAFETERIA_LIMITS = {
  nameMin: 2,
  nameMax: 100,
  locationMax: 150,
  pickupPointMax: 100,
} as const;

export interface Cafeteria {
  id: string;
  name: string;
  /** Dónde está la cafetería (p. ej. "Edificio principal, planta baja"). */
  location: string;
  /** `true` si es del campus. */
  onCampus: boolean;
  /** Dónde se recogen los pedidos (p. ej. "Puerta 1"). */
  pickupPoint: string;
  /** `false` = dada de baja (baja lógica): no aparece en el menú ni acepta órdenes. */
  active: boolean;
  paymentMethods: PaymentMethod[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Datos para crear o editar una cafetería (mismo cuerpo en alta y edición).
 * `active` no va aquí: la baja y la reactivación son operaciones aparte.
 */
export interface CafeteriaData {
  /** Requerido, 2–100 caracteres. */
  name: string;
  /** Requerido, máx. 150 caracteres. */
  location: string;
  onCampus: boolean;
  /** Requerido, máx. 100 caracteres. */
  pickupPoint: string;
  /** Al menos uno. Los repetidos los quita el backend. */
  paymentMethods: PaymentMethod[];
}

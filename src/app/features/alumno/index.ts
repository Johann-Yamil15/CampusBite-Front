// CL-Sprint5 11/11/2026: API pública de la feature alumno; fuera de features/alumno solo se importa desde aquí.
// Solo el store del carrito (app.ts lo vacía al cerrar sesión). El drawer NO se exporta: lo monta el layout
// del alumno, y exportarlo desde aquí metería Angular Material en el bundle inicial.
export { CarritoStore } from './application/carrito.store';
export type { ItemCarrito } from './domain/models/carrito.model';

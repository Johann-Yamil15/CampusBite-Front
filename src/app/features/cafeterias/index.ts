// CL-Sprint3 20/10/2026: API pública de la feature cafeterias; fuera de features/cafeterias solo se importa desde aquí
export { CafeteriaFacade } from './application/cafeteria.facade';
export { provideCafeterias } from './cafeterias.providers';
export { CAFETERIA_LIMITS, PAYMENT_METHODS } from './domain/models/cafeteria.model';
export type { Cafeteria, CafeteriaData, PaymentMethod } from './domain/models/cafeteria.model';

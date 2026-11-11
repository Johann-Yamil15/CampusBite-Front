// CL-Sprint5 11/11/2026: API pública de la feature catalogo; fuera de features/catalogo solo se importa desde aquí
export { CatalogoFacade } from './application/catalogo.facade';
export { provideCatalogo } from './catalogo.providers';
export { METODOS_PAGO } from './domain/models/catalogo.model';
export type {
  MenuCafeteria,
  MetodoPago,
  PlatilloCatalogo,
  ProductoMenu,
} from './domain/models/catalogo.model';

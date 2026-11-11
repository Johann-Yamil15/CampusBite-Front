// CL-Sprint5 11/11/2026: API pública de la feature catalogo; fuera de features/catalogo solo se importa desde aquí
export { CatalogoFacade } from './application/catalogo.facade';
export { provideCatalogo } from './catalogo.providers';
export {
  CRITERIOS_VACIOS,
  DIETAS,
  ETIQUETA_DIETA,
  METODOS_PAGO,
  ORDENES_BUSQUEDA,
  buscarPlatillos,
  filtrosActivos,
} from './domain/models/catalogo.model';
export type {
  CriteriosBusqueda,
  Dieta,
  MenuCafeteria,
  OrdenBusqueda,
  MetodoPago,
  PlatilloCatalogo,
  ProductoMenu,
  Promocion,
} from './domain/models/catalogo.model';

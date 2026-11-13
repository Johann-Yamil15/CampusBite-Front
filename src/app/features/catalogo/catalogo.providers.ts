import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { CatalogoHttpRepository } from '@features/catalogo/data/repositories/catalogo-http.repository';

/**
 * CL-Sprint5 11/11/2026: enlaza el catálogo con su implementación. Se registra en la raíz porque el carrito
 * (global) también lo lee.
 * CL-Sprint5 13/11/2026: conectado al back real (GET api/menu, api/menu/{id} y api/promociones/activas).
 */
export function provideCatalogo(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CatalogoRepository, useClass: CatalogoHttpRepository },
  ]);
}

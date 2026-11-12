import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { CatalogoMockRepository } from '@features/catalogo/data/mock/catalogo-mock.repository';

/**
 * CL-Sprint5 11/11/2026: enlaza el catálogo con su implementación. Se registra en la raíz porque el carrito
 * (global) también lo lee.
 * Mientras el back no tenga GET api/menu va el mock. Para conectar el back:
 *   { provide: CatalogoRepository, useClass: CatalogoHttpRepository }
 */
export function provideCatalogo(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CatalogoRepository, useClass: CatalogoMockRepository },
  ]);
}

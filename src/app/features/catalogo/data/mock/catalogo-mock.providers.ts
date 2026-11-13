import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { CatalogoMockRepository } from './catalogo-mock.repository';

/** CL-Sprint5 13/11/2026: provideCatalogo() con el repositorio falso, para las pruebas. */
export function provideCatalogoMock(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CatalogoRepository, useClass: CatalogoMockRepository }]);
}

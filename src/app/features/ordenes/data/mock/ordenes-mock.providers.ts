import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import { OrdenesMockRepository } from './ordenes-mock.repository';

/** CL-Sprint5 13/11/2026: provideOrdenes() con el repositorio falso, para las pruebas. */
export function provideOrdenesMock(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: OrdenesRepository, useClass: OrdenesMockRepository }]);
}

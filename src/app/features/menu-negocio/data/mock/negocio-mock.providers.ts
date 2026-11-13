import { Provider } from '@angular/core';
import { NegocioFacade } from '@features/menu-negocio/application/negocio.facade';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import { NegocioMockRepository } from './negocio-mock.repository';

/** CL-Sprint5 13/11/2026: provideNegocio() con el repositorio falso, para las pruebas. */
export function provideNegocioMock(): Provider[] {
  return [NegocioFacade, { provide: NegocioRepository, useClass: NegocioMockRepository }];
}

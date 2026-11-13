import { Provider } from '@angular/core';
import { NegocioFacade } from '@features/menu-negocio/application/negocio.facade';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import { NegocioMockRepository } from '@features/menu-negocio/data/mock/negocio-mock.repository';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones del negocio con su implementación. Lo usan
 * menu-negocio.routes.ts (secciones del layout) y las pruebas. Mientras no existan los endpoints va el mock
 * (comparte datos con el catálogo del alumno); para conectar el back:
 *   { provide: NegocioRepository, useClass: NegocioHttpRepository }
 */
export function provideNegocio(): Provider[] {
  return [NegocioFacade, { provide: NegocioRepository, useClass: NegocioMockRepository }];
}

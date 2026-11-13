import { Provider } from '@angular/core';
import { NegocioFacade } from '@features/menu-negocio/application/negocio.facade';
import { NegocioRepository } from '@features/menu-negocio/domain/repositories/negocio.repository';
import { NegocioHttpRepository } from '@features/menu-negocio/data/repositories/negocio-http.repository';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): horario y promociones del negocio con su implementación. Lo usan
 * menu-negocio.routes.ts (secciones del layout) y las pruebas.
 * CL-Sprint5 13/11/2026: conectado al back (NegocioController).
 */
export function provideNegocio(): Provider[] {
  return [NegocioFacade, { provide: NegocioRepository, useClass: NegocioHttpRepository }];
}

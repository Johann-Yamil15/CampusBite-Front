import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { AuthHttpRepository } from '@features/auth/data/repositories/auth-http.repository';

/**
 * JJ-Sprint2 11/10/2026: enlaza el contrato de auth con su implementación HTTP.
 * Se registra en app.config.ts (raíz) porque los guards y el layout usan AuthFacade en toda la app.
 * Para pruebas o mocks basta con cambiar `useClass`.
 */
export function provideAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: AuthRepository, useClass: AuthHttpRepository }]);
}

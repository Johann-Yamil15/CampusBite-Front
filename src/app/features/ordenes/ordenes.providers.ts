import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import { OrdenesHttpRepository } from '@features/ordenes/data/repositories/ordenes-http.repository';

/**
 * CL-Sprint5 11/11/2026: enlaza las órdenes con su implementación. Se registra en la raíz porque las usan
 * el alumno (carrito, pedidos) y la cafetería (tablero).
 * CL-Sprint5 13/11/2026: conectado al back real (OrdenesController).
 */
export function provideOrdenes(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: OrdenesRepository, useClass: OrdenesHttpRepository }]);
}

import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { OrdenesRepository } from '@features/ordenes/domain/repositories/ordenes.repository';
import { OrdenesMockRepository } from '@features/ordenes/data/mock/ordenes-mock.repository';

/**
 * CL-Sprint5 11/11/2026: enlaza las órdenes con su implementación. Se registra en la raíz porque las usan
 * el alumno (carrito, pedidos) y la cafetería (tablero), y deben compartir la misma instancia del mock.
 * Mientras el back no tenga OrdenesController va el mock. Para conectar el back:
 *   { provide: OrdenesRepository, useClass: OrdenesHttpRepository }
 */
export function provideOrdenes(): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: OrdenesRepository, useClass: OrdenesMockRepository }]);
}

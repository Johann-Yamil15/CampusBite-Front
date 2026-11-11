import { Provider } from '@angular/core';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { FavoritosMockRepository } from '@features/alumno/data/mock/favoritos-mock.repository';

/**
 * CL-Sprint5 11/11/2026: favoritos del alumno con su implementación. Lo usa alumno.routes.ts (alcance del
 * layout del alumno) y las pruebas de las pantallas. Mientras no exista el endpoint va el mock; para
 * conectar el back: { provide: FavoritosRepository, useClass: FavoritosHttpRepository }.
 */
export function provideFavoritos(): Provider[] {
  return [FavoritosFacade, { provide: FavoritosRepository, useClass: FavoritosMockRepository }];
}

import { Provider } from '@angular/core';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { FavoritosMockRepository } from '@features/alumno/data/mock/favoritos-mock.repository';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import { PerfilMockRepository } from '@features/alumno/data/mock/perfil-mock.repository';

/**
 * CL-Sprint5 11/11/2026: favoritos del alumno con su implementación. Lo usa alumno.routes.ts (alcance del
 * layout del alumno) y las pruebas de las pantallas. Mientras no exista el endpoint va el mock; para
 * conectar el back: { provide: FavoritosRepository, useClass: FavoritosHttpRepository }.
 */
export function provideFavoritos(): Provider[] {
  return [FavoritosFacade, { provide: FavoritosRepository, useClass: FavoritosMockRepository }];
}

/**
 * CL-Sprint5 11/11/2026 (etapa 8): perfil y preferencias del alumno. Mismo alcance que los favoritos (el
 * layout). Para conectar el back: { provide: PerfilRepository, useClass: PerfilHttpRepository }.
 */
export function providePerfil(): Provider[] {
  return [PerfilFacade, { provide: PerfilRepository, useClass: PerfilMockRepository }];
}

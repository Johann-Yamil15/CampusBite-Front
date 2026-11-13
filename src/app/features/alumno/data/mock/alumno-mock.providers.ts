import { Provider } from '@angular/core';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import { FavoritosMockRepository } from './favoritos-mock.repository';
import { PerfilMockRepository } from './perfil-mock.repository';

/** CL-Sprint5 13/11/2026: provideFavoritos() con el repositorio falso, para las pruebas. */
export function provideFavoritosMock(): Provider[] {
  return [FavoritosFacade, { provide: FavoritosRepository, useClass: FavoritosMockRepository }];
}

/** CL-Sprint5 13/11/2026: providePerfil() con el repositorio falso, para las pruebas. */
export function providePerfilMock(): Provider[] {
  return [PerfilFacade, { provide: PerfilRepository, useClass: PerfilMockRepository }];
}

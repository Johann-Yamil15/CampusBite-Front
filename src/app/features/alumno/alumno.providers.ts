import { Provider } from '@angular/core';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { FavoritosHttpRepository } from '@features/alumno/data/repositories/favoritos-http.repository';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import { PerfilHttpRepository } from '@features/alumno/data/repositories/perfil-http.repository';

/**
 * CL-Sprint5 11/11/2026: favoritos del alumno con su implementación. Lo usa alumno.routes.ts (alcance del
 * layout del alumno). CL-Sprint5 13/11/2026: conectado al back (api/favoritos/...).
 */
export function provideFavoritos(): Provider[] {
  return [FavoritosFacade, { provide: FavoritosRepository, useClass: FavoritosHttpRepository }];
}

/**
 * CL-Sprint5 11/11/2026 (etapa 8): perfil y preferencias del alumno. Mismo alcance que los favoritos (el
 * layout). CL-Sprint5 13/11/2026: conectado al back (api/alumnos/me/... y api/auth/cambiar-password).
 */
export function providePerfil(): Provider[] {
  return [PerfilFacade, { provide: PerfilRepository, useClass: PerfilHttpRepository }];
}

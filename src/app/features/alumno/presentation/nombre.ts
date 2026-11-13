/**
 * CL-Sprint5 11/11/2026 (etapa 8): la regla del nombre vive en el dominio (perfil.model.ts) para que la use
 * también PerfilFacade; aquí se reexporta para no cambiar las importaciones de las pantallas.
 * CL-Sprint5 13/11/2026: el nombre ya viene del back (login, /me y el perfil); se quitó nombreDesdeCorreo.
 */
export { iniciales, nombreVisible } from '@features/alumno/domain/models/perfil.model';

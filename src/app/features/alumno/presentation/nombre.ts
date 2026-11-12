/**
 * CL-Sprint5 11/11/2026: nombre para saludar mientras el back no manda el nombre en /me (pendiente B1).
 * CL-Sprint5 11/11/2026 (etapa 8): la regla se movió al dominio (perfil.model.ts) para que la use también
 * PerfilFacade; aquí se reexporta para no cambiar las importaciones de las pantallas.
 */
export { iniciales, nombreDesdeCorreo, nombreVisible } from '@features/alumno/domain/models/perfil.model';

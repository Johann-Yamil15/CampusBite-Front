// JJ-Sprint2 11/10/2026: API pública de la feature auth; fuera de features/auth solo se importa desde aquí
export { AuthFacade } from './application/auth.facade';
export { authGuard, guestGuard } from './presentation/guards/auth.guard';
export { provideAuth } from './auth.providers';
export type { Session, User, UserRole } from './domain/models/user.model';

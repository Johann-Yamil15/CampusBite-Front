import { Observable } from 'rxjs';
import {
  Credentials,
  RegisterCafeteriaData,
  RegisterData,
  Session,
  User,
} from '@features/auth/domain/models/user.model';

/**
 * Contrato (puerto) del dominio. La capa data provee la implementación
 * y se enlaza en auth.providers.ts → { provide: AuthRepository, useClass: AuthHttpRepository }.
 */
export abstract class AuthRepository {
  abstract login(credentials: Credentials): Observable<Session>;
  abstract registro(data: RegisterData): Observable<Session>;
  // JJ-Sprint3 21/10/2026: TEC-11. Autorregistro de un negocio (POST auth/registro-cafeteria)
  abstract registroCafeteria(data: RegisterCafeteriaData): Observable<Session>;
  abstract me(): Observable<User>;
}

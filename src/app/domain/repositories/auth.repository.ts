import { Observable } from 'rxjs';
import { Credentials, Session, User } from '@domain/models/user.model';

/**
 * Contrato (puerto) del dominio. La capa data provee la implementación
 * y se enlaza en app.config.ts → { provide: AuthRepository, useClass: AuthHttpRepository }.
 */
export abstract class AuthRepository {
  abstract login(credentials: Credentials): Observable<Session>;
  abstract me(): Observable<User>;
}

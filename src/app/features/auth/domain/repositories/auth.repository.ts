import { Observable } from 'rxjs';
import {
  Credentials,
  RegisterCafeteriaData,
  RegisterData,
  RegistroPendiente,
  Session,
  User,
} from '@features/auth/domain/models/user.model';

/**
 * Contrato (puerto) del dominio. La capa data provee la implementación
 * y se enlaza en auth.providers.ts → { provide: AuthRepository, useClass: AuthHttpRepository }.
 */
export abstract class AuthRepository {
  /** 401 correo o contraseña incorrectos; 403 falta verificar el correo; 429 demasiados intentos. */
  abstract login(credentials: Credentials): Observable<Session>;
  /** CL-Sprint5 13/11/2026: ya no inicia sesión; manda el correo de verificación. */
  abstract registro(data: RegisterData): Observable<RegistroPendiente>;
  // JJ-Sprint3 21/10/2026: TEC-11. Autorregistro de un negocio (POST auth/registro-cafeteria)
  // CL-Sprint5 13/11/2026: igual que registro, queda pendiente de verificar el correo
  abstract registroCafeteria(data: RegisterCafeteriaData): Observable<RegistroPendiente>;
  /** CL-Sprint5 13/11/2026: token del enlace del correo → la sesión (igual que el login). 400 si no sirve. */
  abstract verificarCorreo(token: string): Observable<Session>;
  /** CL-Sprint5 13/11/2026: completa siempre (202), exista o no la cuenta, para no revelarla. */
  abstract reenviarVerificacion(correo: string): Observable<void>;
  // JJ-Sprint3 21/10/2026: TEC-12. Completa aunque el correo no exista (el backend no lo revela)
  abstract restablecerPassword(correo: string, nuevaPassword: string): Observable<void>;
  abstract me(): Observable<User>;
}

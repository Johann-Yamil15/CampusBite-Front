import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import {
  Credentials,
  RegisterCafeteriaData,
  RegisterData,
  RegistroPendiente,
  Session,
  User,
} from '@features/auth/domain/models/user.model';
import {
  AuthResponseDto,
  MeResponseDto,
  RegistroPendienteDto,
} from '@features/auth/data/dtos/auth.dto';
import { AuthMapper } from '@features/auth/data/mappers/auth.mapper';

@Injectable()
export class AuthHttpRepository extends AuthRepository {
  private readonly api = inject(ApiClient);

  login(credentials: Credentials): Observable<Session> {
    return this.api
      .post<AuthResponseDto>('auth/login', AuthMapper.toLoginRequest(credentials))
      .pipe(map(AuthMapper.toSession));
  }

  registro(data: RegisterData): Observable<RegistroPendiente> {
    return this.api
      .post<RegistroPendienteDto>('auth/registro', AuthMapper.toRegistroRequest(data))
      .pipe(map(AuthMapper.toRegistroPendiente));
  }

  // JJ-Sprint3 21/10/2026: TEC-11
  registroCafeteria(data: RegisterCafeteriaData): Observable<RegistroPendiente> {
    return this.api
      .post<RegistroPendienteDto>('auth/registro-cafeteria', AuthMapper.toRegistroCafeteriaRequest(data))
      .pipe(map(AuthMapper.toRegistroPendiente));
  }

  // CL-Sprint5 13/11/2026: el enlace del correo trae ?token=...; si sirve, responde la sesión como el login
  verificarCorreo(token: string): Observable<Session> {
    return this.api
      .post<AuthResponseDto>('auth/verificar-correo', { token })
      .pipe(map(AuthMapper.toSession));
  }

  // CL-Sprint5 13/11/2026: responde 202 con { mensaje }; a la UI solo le importa que completó
  reenviarVerificacion(correo: string): Observable<void> {
    return this.api
      .post<unknown>('auth/reenviar-verificacion', { correo })
      .pipe(map(() => undefined));
  }

  // JJ-Sprint3 21/10/2026: TEC-12. El backend responde { mensaje }; a la UI solo le importa que completó
  restablecerPassword(correo: string, nuevaPassword: string): Observable<void> {
    return this.api
      .post<unknown>('auth/restablecer-password', AuthMapper.toRestablecerPasswordRequest(correo, nuevaPassword))
      .pipe(map(() => undefined));
  }

  me(): Observable<User> {
    return this.api.get<MeResponseDto>('auth/me').pipe(map(AuthMapper.toUser));
  }
}

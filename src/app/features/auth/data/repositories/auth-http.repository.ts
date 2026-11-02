import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { ApiError } from '@core/http/api-error';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import {
  Credentials,
  RegisterCafeteriaData,
  RegisterData,
  Session,
  User,
} from '@features/auth/domain/models/user.model';
import { AuthResponseDto, MeResponseDto } from '@features/auth/data/dtos/auth.dto';
import { AuthMapper } from '@features/auth/data/mappers/auth.mapper';

@Injectable()
export class AuthHttpRepository extends AuthRepository {
  private readonly api = inject(ApiClient);

  login(credentials: Credentials): Observable<Session> {
    return this.api
      .post<AuthResponseDto>('auth/login', AuthMapper.toLoginRequest(credentials))
      .pipe(map(AuthMapper.toSession));
  }

  registro(data: RegisterData): Observable<Session> {
    return this.api
      .post<AuthResponseDto>('auth/registro', AuthMapper.toRegistroRequest(data))
      .pipe(map(AuthMapper.toSession));
  }

  // JJ-Sprint3 21/10/2026: TEC-11
  registroCafeteria(data: RegisterCafeteriaData): Observable<Session> {
    return this.api
      .post<AuthResponseDto>('auth/registro-cafeteria', AuthMapper.toRegistroCafeteriaRequest(data))
      .pipe(map(AuthMapper.toSession));
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

  // CL-Sprint4 28/10/2026: HU-07B. TEMPORAL: borrar cuando el backend devuelva idCafeteria en login y /me
  puedeVerProductos(cafeteriaId: string): Observable<boolean> {
    return this.api.get<unknown>(`cafeterias/${cafeteriaId}/productos`).pipe(
      map(() => true),
      catchError((err: ApiError) => (err.status === 403 ? of(false) : throwError(() => err))),
    );
  }
}

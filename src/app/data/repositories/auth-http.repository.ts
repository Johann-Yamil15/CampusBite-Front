import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Credentials, RegisterData, Session, User } from '@domain/models/user.model';
import { AuthResponseDto, MeResponseDto } from '@data/dtos/auth.dto';
import { AuthMapper } from '@data/mappers/auth.mapper';

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

  me(): Observable<User> {
    return this.api.get<MeResponseDto>('auth/me').pipe(map(AuthMapper.toUser));
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { Credentials, Session, User } from '@domain/models/user.model';
import { LoginRequestDto, LoginResponseDto, UserDto } from '@data/dtos/auth.dto';
import { AuthMapper } from '@data/mappers/auth.mapper';

@Injectable()
export class AuthHttpRepository extends AuthRepository {
  private readonly api = inject(ApiClient);

  login(credentials: Credentials): Observable<Session> {
    const body: LoginRequestDto = { email: credentials.email, password: credentials.password };
    return this.api.post<LoginResponseDto>('auth/login', body).pipe(map(AuthMapper.toSession));
  }

  me(): Observable<User> {
    return this.api.get<UserDto>('auth/me').pipe(map(AuthMapper.toUser));
  }
}

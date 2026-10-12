import { Credentials, RegisterData, Session, User } from '@features/auth/domain/models/user.model';
import {
  AuthResponseDto,
  LoginRequestDto,
  MeResponseDto,
  RegistroRequestDto,
} from '@features/auth/data/dtos/auth.dto';

export const AuthMapper = {
  toUser(dto: MeResponseDto): User {
    return { id: dto.id, email: dto.correo, role: dto.rol };
  },

  toSession(dto: AuthResponseDto): Session {
    return {
      user: { id: dto.usuarioId, email: dto.correo, role: dto.rol },
      accessToken: dto.token,
      expiresAt: new Date(dto.expiraEn),
    };
  },

  toLoginRequest(credentials: Credentials): LoginRequestDto {
    return { correo: credentials.email, password: credentials.password };
  },

  toRegistroRequest(data: RegisterData): RegistroRequestDto {
    return {
      nombre: data.name,
      correo: data.email,
      password: data.password,
      matricula: data.studentId || null,
      telefono: data.phone || null,
    };
  },
};

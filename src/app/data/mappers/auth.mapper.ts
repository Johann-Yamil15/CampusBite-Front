import { Session, User } from '@domain/models/user.model';
import { LoginResponseDto, UserDto } from '@data/dtos/auth.dto';

export const AuthMapper = {
  toUser(dto: UserDto): User {
    return { id: dto.id, name: dto.nombre, email: dto.email, roles: dto.roles ?? [] };
  },

  toSession(dto: LoginResponseDto): Session {
    return {
      user: AuthMapper.toUser(dto.usuario),
      accessToken: dto.token,
      expiresAt: new Date(dto.expiration),
    };
  },
};

import {
  Credentials,
  RegisterCafeteriaData,
  RegisterData,
  Session,
  User,
} from '@features/auth/domain/models/user.model';
import {
  AuthResponseDto,
  LoginRequestDto,
  MeResponseDto,
  RegistroCafeteriaRequestDto,
  RegistroRequestDto,
  RestablecerPasswordRequestDto,
} from '@features/auth/data/dtos/auth.dto';

export const AuthMapper = {
  toUser(dto: MeResponseDto): User {
    return { id: dto.id, email: dto.correo, role: dto.rol, ...cafeteriaOf(dto.idCafeteria) };
  },

  toSession(dto: AuthResponseDto): Session {
    return {
      user: {
        id: dto.usuarioId,
        email: dto.correo,
        role: dto.rol,
        ...cafeteriaOf(dto.idCafeteria),
      },
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

  // JJ-Sprint3 21/10/2026: TEC-11
  toRegistroCafeteriaRequest(data: RegisterCafeteriaData): RegistroCafeteriaRequestDto {
    return {
      nombreEncargado: data.ownerName,
      correo: data.email,
      password: data.password,
      telefono: data.phone || null,
      nombreCafeteria: data.cafeteriaName,
      ubicacion: data.location,
      esDelCampus: data.onCampus,
      puntoEntrega: data.pickupPoint,
      metodosPago: data.paymentMethods,
    };
  },

  // JJ-Sprint3 21/10/2026: TEC-12
  toRestablecerPasswordRequest(correo: string, nuevaPassword: string): RestablecerPasswordRequestDto {
    return { correo, nuevaPassword };
  },
};

// CL-Sprint4 28/10/2026: HU-07B. Solo agrega cafeteriaId si el backend lo mandó (si no, el campo no existe)
function cafeteriaOf(idCafeteria: string | null | undefined): Pick<User, 'cafeteriaId'> {
  return idCafeteria ? { cafeteriaId: idCafeteria } : {};
}

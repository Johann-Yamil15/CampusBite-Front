/** Forma EXACTA que devuelve el backend .NET. Ajustar si cambia el contrato del API. */
export interface UserDto {
  id: string;
  nombre: string;
  email: string;
  roles: string[];
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  token: string;
  expiration: string;
  usuario: UserDto;
}

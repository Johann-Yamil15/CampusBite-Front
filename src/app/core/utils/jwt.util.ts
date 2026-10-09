/**
 * Lectura del payload de un JWT en el cliente, sin librerías.
 * NO valida la firma: eso lo hace el backend. Aquí solo sirve para saber si ya expiró
 * y evitar mostrar rutas privadas con un token vencido.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;

  try {
    const base64 = part
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(part.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** `true` si el token existe, se puede decodificar y su `exp` (segundos) no ha pasado. */
export function isJwtActive(token: string | null, now: number = Date.now()): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = payload['exp'];
  return typeof exp !== 'number' || exp * 1000 > now;
}

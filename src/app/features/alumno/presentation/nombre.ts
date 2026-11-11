/**
 * CL-Sprint5 11/11/2026: nombre para saludar mientras el back no manda el nombre en /me (pendiente B1): se
 * arma con la parte del correo antes de la @ ("juan.perez" → "Juan Perez"). Lo usan el layout y el inicio.
 */
export function nombreDesdeCorreo(correo: string | null | undefined): string {
  const local = correo?.split('@')[0]?.trim();
  if (!local) return 'Alumno';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

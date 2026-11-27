/** Error normalizado que reciben las capas superiores (independiente de HttpClient). */
export interface ApiError {
  status: number;
  message: string;
  /** Errores de validación estilo ProblemDetails de ASP.NET Core. */
  errors?: Record<string, string[]>;
  /**
   * CL-Sprint5 26/11/2026: `true` si la petición no salió del navegador (no había internet). Con status 0 y sin
   * esta marca, la petición pudo llegar al servidor y perderse la respuesta.
   */
  noEnviado?: boolean;
}

/** CL-Sprint5 26/11/2026: `true` si el error es por falta de red o de respuesta del servidor (status 0). */
export function esErrorDeRed(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && (e as ApiError).status === 0;
}

/** Error normalizado que reciben las capas superiores (independiente de HttpClient). */
export interface ApiError {
  status: number;
  message: string;
  /** Errores de validación estilo ProblemDetails de ASP.NET Core. */
  errors?: Record<string, string[]>;
}

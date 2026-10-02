export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Todo lo que va aquí termina dentro del bundle JS y es visible en el navegador.
 * NUNCA pongas secretos (client secrets, connection strings, API keys privadas).
 */
export interface Environment {
  production: boolean;
  appName: string;
  apiUrl: string;
  runtimeConfigPath: string;
  logLevel: LogLevel;
}

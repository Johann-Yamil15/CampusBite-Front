import { Environment } from './environment.model';

/**
 * Producción. Valores por defecto NO sensibles.
 * La URL real del API se inyecta en runtime desde /config/runtime-config.json
 * (generado por el contenedor a partir de variables de entorno).
 */
export const environment: Environment = {
  production: true,
  appName: 'CampusBite',
  apiUrl: '/api',
  runtimeConfigPath: '/config/runtime-config.json',
  logLevel: 'error',
};

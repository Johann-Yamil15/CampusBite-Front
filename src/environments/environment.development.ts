import { Environment } from './environment.model';

/**
 * Desarrollo. `/api` se redirige al backend .NET mediante proxy.conf.json,
 * así evitamos CORS en local.
 */
export const environment: Environment = {
  production: false,
  appName: 'CampusBite (dev)',
  apiUrl: '/api',
  runtimeConfigPath: '/config/runtime-config.json',
  logLevel: 'debug',
};

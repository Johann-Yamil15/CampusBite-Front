import { Injectable, signal } from '@angular/core';
import { environment } from '@env/environment';
import { LogLevel } from '@env/environment.model';

export interface RuntimeConfig {
  apiUrl: string;
  logLevel: LogLevel;
}

/**
 * Configuración resuelta en tiempo de ejecución.
 * Permite usar el MISMO build en QA / producción cambiando solo variables de entorno.
 */
@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly config = signal<RuntimeConfig>({
    apiUrl: environment.apiUrl,
    logLevel: environment.logLevel,
  });

  get apiUrl(): string {
    return this.config().apiUrl.replace(/\/+$/, '');
  }

  get logLevel(): LogLevel {
    return this.config().logLevel;
  }

  async load(): Promise<void> {
    try {
      const res = await fetch(environment.runtimeConfigPath, { cache: 'no-store' });
      if (!res.ok) return;
      const remote = (await res.json()) as Partial<RuntimeConfig>;
      this.config.update((current) => ({ ...current, ...remote }));
    } catch {
      // Sin runtime-config.json se usan los valores de environment.ts
    }
  }
}

import { Injectable, inject } from '@angular/core';
import { LogLevel } from '@env/environment.model';
import { AppConfigService } from '@core/config/app-config.service';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly config = inject(AppConfigService);

  debug(...args: unknown[]): void {
    if (this.enabled('debug')) console.debug(...args);
  }

  info(...args: unknown[]): void {
    if (this.enabled('info')) console.info(...args);
  }

  warn(...args: unknown[]): void {
    if (this.enabled('warn')) console.warn(...args);
  }

  error(...args: unknown[]): void {
    if (this.enabled('error')) console.error(...args);
  }

  private enabled(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.config.logLevel];
  }
}

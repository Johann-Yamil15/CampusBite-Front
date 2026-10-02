import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppConfigService } from '@core/config/app-config.service';
import { TokenStorageService } from '@core/services/token-storage.service';

/** Adjunta el Bearer token solo a peticiones dirigidas a nuestro API. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorageService).get();
  const apiUrl = inject(AppConfigService).apiUrl;

  if (!token || !req.url.startsWith(apiUrl)) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

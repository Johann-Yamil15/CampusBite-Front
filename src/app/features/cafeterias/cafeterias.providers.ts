import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { CafeteriaRepository } from '@features/cafeterias/domain/repositories/cafeteria.repository';
import { CafeteriaHttpRepository } from '@features/cafeterias/data/repositories/cafeteria-http.repository';

/**
 * CL-Sprint3 20/10/2026: enlaza el contrato de cafeterías con su implementación HTTP.
 * Se registra en app.config.ts (raíz) porque las cafeterías las usan varias partes de la app
 * (panel del admin y, después, el alumno al elegir dónde pedir). Para pruebas o mocks basta con cambiar `useClass`.
 */
export function provideCafeterias(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CafeteriaRepository, useClass: CafeteriaHttpRepository },
  ]);
}

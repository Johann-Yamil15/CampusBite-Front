import { Provider } from '@angular/core';
import { AuthRepository } from '@domain/repositories/auth.repository';
import { ProductRepository } from '@domain/repositories/product.repository';
import { AuthHttpRepository } from '@data/repositories/auth-http.repository';
import { ProductHttpRepository } from '@data/repositories/product-http.repository';

/**
 * Inversión de dependencias: el dominio define el contrato, aquí se elige la implementación.
 * Para tests o mocks basta con cambiar `useClass`.
 */
export const DATA_PROVIDERS: Provider[] = [
  { provide: AuthRepository, useClass: AuthHttpRepository },
  { provide: ProductRepository, useClass: ProductHttpRepository },
];

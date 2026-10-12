import { Routes } from '@angular/router';
import { ProductFacade } from '@features/products/application/product.facade';
import { ProductRepository } from '@features/products/domain/repositories/product.repository';
import { ProductHttpRepository } from '@features/products/data/repositories/product-http.repository';

/**
 * JJ-Sprint2 11/10/2026: rutas de la feature products. Sus providers viven aquí (no en la raíz):
 * se cargan solo al entrar a la feature y no hay que tocar app.config.ts para agregarlos.
 */
export default [
  {
    path: '',
    title: 'Menú · CampusBite',
    providers: [ProductFacade, { provide: ProductRepository, useClass: ProductHttpRepository }],
    loadComponent: () =>
      import('@features/products/presentation/pages/products/products.page').then(
        (m) => m.ProductsPage,
      ),
  },
] satisfies Routes;

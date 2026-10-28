import { Routes } from '@angular/router';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { MenuRepository } from '@features/menu-negocio/domain/repositories/menu.repository';
import { MenuHttpRepository } from '@features/menu-negocio/data/repositories/menu-http.repository';

/**
 * CL-Sprint4 28/10/2026: HU-07B. Panel del negocio (`/negocio/:id`). Se monta en app.routes.ts con
 * roleGuard('AdminCafeteria'). Sus providers viven aquí (alcance de la feature), como en products.routes.ts;
 * el CafeteriaFacade lo provee la feature cafeterias en la raíz.
 */
export default [
  {
    path: '',
    title: 'Mi negocio · CampusBite',
    providers: [MenuNegocioFacade, { provide: MenuRepository, useClass: MenuHttpRepository }],
    loadComponent: () =>
      import('@features/menu-negocio/presentation/pages/panel-negocio/panel-negocio.page').then(
        (m) => m.PanelNegocioPage,
      ),
  },
] satisfies Routes;

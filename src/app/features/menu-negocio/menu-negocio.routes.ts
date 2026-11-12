import { Routes } from '@angular/router';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { MenuRepository } from '@features/menu-negocio/domain/repositories/menu.repository';
import { MenuHttpRepository } from '@features/menu-negocio/data/repositories/menu-http.repository';

/**
 * CL-Sprint4 28/10/2026: HU-07B. Panel del negocio (`/mi-negocio`). Se monta en app.routes.ts con
 * roleGuard('AdminCafeteria') y el resolver que pone el id de la cafetería (no va en la URL).
 * Sus providers viven aquí (alcance de la feature), como en products.routes.ts; el CafeteriaFacade
 * lo provee la feature cafeterias en la raíz.
 *
 * JY-Sprint4 05/11/2026: las secciones nuevas (cascarón visual) cuelgan de NegocioLayoutComponent para
 * compartir el sidebar. El panel de Inicio sigue con su propio chrome, por eso es `pathMatch: 'full'`
 * y no un hijo del layout.
 */
export default [
  {
    path: '',
    pathMatch: 'full',
    title: 'Mi negocio · CampusBite',
    providers: [MenuNegocioFacade, { provide: MenuRepository, useClass: MenuHttpRepository }],
    loadComponent: () =>
      import('@features/menu-negocio/presentation/pages/panel-negocio/panel-negocio.page').then(
        (m) => m.PanelNegocioPage,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('@features/menu-negocio/presentation/layout/negocio-layout.component').then(
        (m) => m.NegocioLayoutComponent,
      ),
    children: [
      {
        path: 'pedidos',
        title: 'Pedidos · CampusBite',
        loadComponent: () =>
          import(
            '@features/menu-negocio/presentation/pages/pedidos-negocio/pedidos-negocio.page'
          ).then((m) => m.PedidosNegocioPage),
      },
      {
        path: 'promociones',
        title: 'Promociones · CampusBite',
        loadComponent: () =>
          import('@features/menu-negocio/presentation/pages/promociones/promociones.page').then(
            (m) => m.PromocionesPage,
          ),
      },
      {
        path: 'estadisticas',
        title: 'Estadísticas · CampusBite',
        loadComponent: () =>
          import('@features/menu-negocio/presentation/pages/estadisticas/estadisticas.page').then(
            (m) => m.EstadisticasPage,
          ),
      },
      {
        path: 'horario',
        title: 'Horario · CampusBite',
        loadComponent: () =>
          import('@features/menu-negocio/presentation/pages/horario/horario.page').then(
            (m) => m.HorarioPage,
          ),
      },
      {
        // CL-Sprint5 11/11/2026 (etapa 9): datos del negocio y métodos de pago (CafeteriaFacade.update)
        path: 'configuracion',
        title: 'Configuración · CampusBite',
        loadComponent: () =>
          import('@features/menu-negocio/presentation/pages/configuracion/configuracion.page').then(
            (m) => m.ConfiguracionPage,
          ),
      },
    ],
  },
] satisfies Routes;

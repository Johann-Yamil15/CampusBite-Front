import { Routes } from '@angular/router';

/**
 * JY-Sprint4 05/11/2026: rutas del alumno (cascarón visual). Todas cuelgan de AlumnoLayoutComponent para
 * que el sidebar y la topbar no se vuelvan a dibujar al cambiar de sección.
 * El guard de sesión lo pone app.routes.ts al montar la feature.
 */
export default [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/layout/alumno-layout.component').then((m) => m.AlumnoLayoutComponent),
    children: [
      {
        path: 'buscar',
        title: 'Buscar · CampusBite',
        loadComponent: () =>
          import('./presentation/pages/buscar/buscar.page').then((m) => m.BuscarPage),
      },
      {
        path: 'pedidos',
        title: 'Mis pedidos · CampusBite',
        loadComponent: () =>
          import('./presentation/pages/pedidos/pedidos.page').then((m) => m.PedidosPage),
      },
      {
        // El folio llega al componente como input `folio` (withComponentInputBinding)
        path: 'pedidos/:folio',
        title: 'Detalle del pedido · CampusBite',
        loadComponent: () =>
          import('./presentation/pages/pedido-detalle/pedido-detalle.page').then(
            (m) => m.PedidoDetallePage,
          ),
      },
      {
        path: 'favoritos',
        title: 'Favoritos · CampusBite',
        loadComponent: () =>
          import('./presentation/pages/favoritos/favoritos.page').then((m) => m.FavoritosPage),
      },
      {
        path: 'perfil',
        title: 'Mi perfil · CampusBite',
        loadComponent: () =>
          import('./presentation/pages/perfil/perfil.page').then((m) => m.PerfilPage),
      },
    ],
  },
] satisfies Routes;

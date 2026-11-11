import { Routes } from '@angular/router';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { FavoritosMockRepository } from '@features/alumno/data/mock/favoritos-mock.repository';

/**
 * JY-Sprint4 05/11/2026: rutas del alumno (cascarón visual). Todas cuelgan de AlumnoLayoutComponent para
 * que el sidebar y la topbar no se vuelvan a dibujar al cambiar de sección.
 * El guard de sesión lo pone app.routes.ts al montar la feature.
 *
 * CL-Sprint5 11/11/2026: el inicio del alumno es "/" y ya vive dentro del layout; /inicio queda como
 * redirección para los enlaces viejos. Los favoritos se proveen aquí con su repositorio mock; para
 * conectar el back se cambia `useClass` por FavoritosHttpRepository. El detalle va por id: /pedidos/:id.
 * app.routes.ts monta esta feature con authGuard y negocioHomeGuard (el encargado va a /mi-negocio).
 */
export default [
  { path: 'inicio', pathMatch: 'full', redirectTo: '' },
  {
    path: '',
    providers: [
      FavoritosFacade,
      { provide: FavoritosRepository, useClass: FavoritosMockRepository },
    ],
    loadComponent: () =>
      import('./presentation/layout/alumno-layout.component').then((m) => m.AlumnoLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Inicio · CampusBite',
        loadComponent: () =>
          import('./presentation/pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
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
        // El id llega al componente como input `id` (withComponentInputBinding)
        path: 'pedidos/:id',
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

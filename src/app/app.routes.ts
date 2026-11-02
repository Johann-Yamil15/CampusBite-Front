import { Routes } from '@angular/router';
import {
  authGuard,
  cafeteriaDelEncargadoResolver,
  negocioHomeGuard,
  roleGuard,
} from '@features/auth';

/**
 * Rutas raíz: solo montan features (cada una define sus rutas en `<feature>.routes.ts`).
 * Todo se carga de forma diferida (lazy) → bundle inicial pequeño.
 * Lo que cuelga del MainLayout es privado (authGuard); /auth/* es solo para visitantes.
 */
export const routes: Routes = [
  { path: 'auth', loadChildren: () => import('@features/auth/auth.routes') },
  // Alias cortos que ya usa la app (logout, enlaces de las pantallas)
  { path: 'login', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: 'register', pathMatch: 'full', redirectTo: 'auth/register' },
  // JJ-Sprint3 21/10/2026: cascarón visual (HU futura les da funcionalidad). Traen su propia navegación
  // inferior completa, por eso van fuera del MainLayout (que tiene su propia barra superior) y no dentro.
  // CL-Sprint4 28/10/2026: HU-07B. negocioHomeGuard lleva al encargado a su panel /mi-negocio
  {
    path: '',
    canActivate: [authGuard, negocioHomeGuard],
    loadChildren: () => import('@features/home/home.routes'),
  },
  {
    path: 'negocio',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/cafeterias/presentation/pages/perfil-negocio/perfil-negocio.page').then(
        (m) => m.PerfilNegocioPage,
      ),
  },
  // CL-Sprint4 28/10/2026: HU-07B. Panel del negocio, solo para AdminCafeteria. Trae su propia
  // navegación (sidebar del Panel de Negocio), por eso va fuera del MainLayout. roleGuard ya exige
  // sesión. El id de la cafetería no va en la URL: lo resuelve cafeteriaDelEncargadoResolver y
  // llega al panel como input `id`.
  {
    path: 'mi-negocio',
    canActivate: [roleGuard('AdminCafeteria')],
    resolve: { id: cafeteriaDelEncargadoResolver },
    loadChildren: () => import('@features/menu-negocio/menu-negocio.routes'),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('@shell/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      { path: 'productos', loadChildren: () => import('@features/products/products.routes') },
      // JJ-Sprint3 21/10/2026: panel admin dentro del MainLayout (sesión) y solo para AdminSistema
      {
        path: 'admin',
        canActivate: [roleGuard('AdminSistema')],
        loadChildren: () => import('@features/admin/admin.routes'),
      },
    ],
  },
  {
    path: '**',
    title: 'No encontrado · CampusBite',
    loadComponent: () => import('@shell/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];


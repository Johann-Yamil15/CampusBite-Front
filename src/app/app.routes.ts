import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '@features/auth';

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
  { path: '', canActivate: [authGuard], loadChildren: () => import('@features/home/home.routes') },
  {
    path: 'negocio',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/cafeterias/presentation/pages/perfil-negocio/perfil-negocio.page').then(
        (m) => m.PerfilNegocioPage,
      ),
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


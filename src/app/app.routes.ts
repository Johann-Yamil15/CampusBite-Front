import { Routes } from '@angular/router';
import { authGuard } from '@features/auth';

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
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('@shell/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      { path: '', loadChildren: () => import('@features/home/home.routes') },
      { path: 'productos', loadChildren: () => import('@features/products/products.routes') },
    ],
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    title: 'No encontrado · CampusBite',
    loadComponent: () => import('@shell/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  
  
];


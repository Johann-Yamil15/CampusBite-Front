import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

/**
 * Todas las páginas se cargan de forma diferida (lazy) → bundle inicial pequeño.
 * Todo lo que cuelga del MainLayout es privado (authGuard); /auth/* es solo para visitantes.
 */
export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@presentation/layouts/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    children: [
      {
        path: 'login',
        title: 'Iniciar sesión · CampusBite',
        loadComponent: () =>
          import('@presentation/pages/login/login.page').then((m) => m.LoginPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'login' },
    ],
  },
  // JJ-Sprint2 11/10/2026: registro solo para visitantes (guestGuard), igual que el login
  {
    path: 'register',
    canActivate: [guestGuard],
    title: 'Registro · CampusBite',
    loadComponent: () =>
      import('@presentation/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('@presentation/layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        title: 'CampusBite',
        loadComponent: () => import('@presentation/pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'productos',
        title: 'Menú · CampusBite',
        loadComponent: () =>
          import('@presentation/pages/products/products.page').then((m) => m.ProductsPage),
      },
    ],
  },
  { path: 'login', pathMatch: 'full', redirectTo: 'auth/login' },
  {
    path: '**',
    title: 'No encontrado · CampusBite',
    loadComponent: () =>
      import('@presentation/pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

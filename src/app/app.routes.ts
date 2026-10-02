import { Routes } from '@angular/router';
import { authGuard, guestGuard } from '@core/guards/auth.guard';

/** Todas las páginas se cargan de forma diferida (lazy) → bundle inicial pequeño. */
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
  {
    path: '',
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
        canActivate: [authGuard],
        loadComponent: () =>
          import('@presentation/pages/products/products.page').then((m) => m.ProductsPage),
      },
    ],
  },
  {
    path: '**',
    title: 'No encontrado · CampusBite',
    loadComponent: () =>
      import('@presentation/pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];

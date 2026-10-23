import { Routes } from '@angular/router';
import { guestGuard } from '@features/auth/presentation/guards/auth.guard';

/** JJ-Sprint2 11/10/2026: rutas de la feature auth (/auth/*), solo para visitantes. */
export default [
  {
    path: 'login',
    title: 'Iniciar sesión · CampusBite',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/presentation/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    title: 'Registro · CampusBite',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/presentation/pages/register/register.page').then(
        (m) => m.RegisterPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
] satisfies Routes;

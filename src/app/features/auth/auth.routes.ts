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
  {
    // JJ-Sprint3 21/10/2026: TEC-12
    path: 'recuperar',
    title: 'Recuperar contraseña · CampusBite',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/presentation/pages/recuperar/recuperar.page').then(
        (m) => m.RecuperarPage,
      ),
  },
  {
    // CL-Sprint5 13/11/2026: destino del enlace del correo de verificación. Sin guestGuard: el enlace puede
    // abrirse con otra sesión abierta y, si sirve, la reemplaza (como un login).
    path: 'verificar-correo',
    title: 'Verificar correo · CampusBite',
    loadComponent: () =>
      import('@features/auth/presentation/pages/verificar-correo/verificar-correo.page').then(
        (m) => m.VerificarCorreoPage,
      ),
  },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
] satisfies Routes;

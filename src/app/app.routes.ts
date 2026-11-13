import { isDevMode } from '@angular/core';
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
  // CL-Sprint4 28/10/2026: HU-07B. negocioHomeGuard lleva al encargado a su panel /mi-negocio
  // CL-Sprint5 11/11/2026: "/" es el inicio del alumno (antes la maqueta de features/home, ya retirada) y
  // la feature alumno trae todas sus pantallas bajo su layout: /, /buscar, /pedidos, /pedidos/:id,
  // /favoritos y /perfil (/inicio redirige a /). Va antes del MainLayout para que "/" sea suyo.
  {
    path: '',
    canActivate: [authGuard, negocioHomeGuard],
    loadChildren: () => import('@features/alumno/alumno.routes'),
  },
  // CL-Sprint5 11/11/2026: cafeteriaDelEncargadoResolver (auth) manda aquí cuando no encuentra la cafetería
  // del encargado. Antes era la maqueta del perfil de negocio con datos fijos; ahora un aviso honesto con
  // reintentar y cerrar sesión. No redirige a /mi-negocio: el resolver volvería a fallar y haría un ciclo.
  {
    path: 'negocio',
    canActivate: [authGuard],
    title: 'Tu negocio · CampusBite',
    loadComponent: () =>
      import('@shell/sin-negocio/sin-negocio.page').then((m) => m.SinNegocioPage),
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
  // CL-Sprint5 11/11/2026: catálogo vivo del sistema de diseño, solo en desarrollo (en producción no existe)
  {
    path: 'sistema-diseno',
    canMatch: [() => isDevMode()],
    title: 'Sistema de diseño · CampusBite',
    loadComponent: () =>
      import('@shell/sistema-diseno/sistema-diseno.page').then((m) => m.SistemaDisenoPage),
  },
  {
    path: '**',
    title: 'No encontrado · CampusBite',
    loadComponent: () => import('@shell/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];


import { Routes } from '@angular/router';

/** JJ-Sprint2 11/10/2026: rutas de la feature home (pantalla de inicio). */
export default [
  {
    path: '',
    title: 'CampusBite',
    loadComponent: () =>
      import('@features/home/presentation/pages/home/home.page').then((m) => m.HomePage),
  },
] satisfies Routes;

import { Routes } from '@angular/router';

/**
 * FB-Sprint3 21/10/2026: rutas del panel de administración (HU-06A).
 * JJ-Sprint3 21/10/2026: se montan en app.routes.ts dentro del MainLayout con roleGuard('AdminSistema').
 * El CafeteriaFacade lo provee la feature cafeterias en la raíz (provideCafeterias), no hace falta registrarlo aquí.
 */
export default [
  {
    path: '',
    title: 'Administración · CampusBite',
    loadComponent: () =>
      import('@features/admin/presentation/pages/admin-panel/admin-panel.page').then(
        (m) => m.AdminPanelPage,
      ),
  },
] satisfies Routes;

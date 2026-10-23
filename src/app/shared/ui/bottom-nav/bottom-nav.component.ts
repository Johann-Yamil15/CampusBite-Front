// JJ-Sprint3 21/10/2026: navegación inferior estilo app de pedidos (Inicio/Buscar/Pedidos/Perfil).
// Cascarón visual: los enlaces son reales (routerLink), pero las páginas de destino aún no existen todas;
// se van completando en las siguientes historias. Compartido por las pantallas de alumno y de negocio.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface BottomNavItem {
  icon: 'home' | 'search' | 'orders' | 'profile' | 'store' | 'menu' | 'stats';
  label: string;
  link: string;
  exact?: boolean;
}

export const ALUMNO_NAV: BottomNavItem[] = [
  { icon: 'home', label: 'Inicio', link: '/', exact: true },
  { icon: 'search', label: 'Buscar', link: '/buscar' },
  { icon: 'orders', label: 'Pedidos', link: '/pedidos' },
  { icon: 'profile', label: 'Perfil', link: '/perfil' },
];

export const NEGOCIO_NAV: BottomNavItem[] = [
  { icon: 'store', label: 'Mi negocio', link: '/negocio', exact: true },
  { icon: 'menu', label: 'Productos', link: '/negocio/productos' },
  { icon: 'orders', label: 'Pedidos', link: '/negocio/pedidos' },
  { icon: 'stats', label: 'Reportes', link: '/negocio/reportes' },
];

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomNavComponent {
  readonly items = input.required<BottomNavItem[]>();
}

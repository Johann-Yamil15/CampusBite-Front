// CL-Sprint4 28/10/2026: HU-07B. Navegación lateral del Panel de Negocio (sidebar naranja; barra inferior en < 960px).
// JY-Sprint4 05/11/2026: Pedidos, Promociones, Estadísticas y Horario ya tienen pantalla (cascarón visual),
// así que dejan de ser "Pronto" y navegan de verdad. "Perfil del negocio" vive en Inicio y Configuración
// sigue sin historia.
// CL-Sprint5 11/11/2026 (etapa 9): Configuración ya existe (datos del negocio y métodos de pago), así que deja
// de ser "Pronto". Pedidos muestra cuántos pedidos nuevos esperan.
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Cafeteria } from '@features/cafeterias';

export type NegocioNavIcon =
  | 'inicio'
  | 'pedidos'
  | 'menu'
  | 'promociones'
  | 'estadisticas'
  | 'perfil'
  | 'horario'
  | 'configuracion';

interface NavItem {
  icon: NegocioNavIcon;
  label: string;
  /** `link` = navega a su pantalla; `menu` = salta a la galería; `soon` = aún no existe. */
  kind: 'link' | 'menu' | 'soon';
  /** Solo para `link`. */
  link?: string;
  /** Solo Inicio: no debe quedar activo estando en una subruta. */
  exact?: boolean;
}

const NAV: NavItem[] = [
  { icon: 'inicio', label: 'Inicio', kind: 'link', link: '/mi-negocio', exact: true },
  { icon: 'pedidos', label: 'Pedidos', kind: 'link', link: '/mi-negocio/pedidos' },
  { icon: 'menu', label: 'Menú', kind: 'menu' },
  { icon: 'promociones', label: 'Promociones', kind: 'link', link: '/mi-negocio/promociones' },
  { icon: 'estadisticas', label: 'Estadísticas', kind: 'link', link: '/mi-negocio/estadisticas' },
  { icon: 'horario', label: 'Horario', kind: 'link', link: '/mi-negocio/horario' },
  { icon: 'configuracion', label: 'Configuración', kind: 'link', link: '/mi-negocio/configuracion' },
];

@Component({
  selector: 'app-negocio-nav',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive],
  templateUrl: './negocio-nav.component.html',
  styleUrl: './negocio-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NegocioNavComponent {
  /** La cafetería (o `null` mientras carga) para la tarjeta de abajo. */
  readonly cafeteria = input<Cafeteria | null>(null);
  /** CL-Sprint5 11/11/2026 (etapa 9): pedidos nuevos (insignia de "Pedidos"); 0 = sin insignia. */
  readonly pedidosNuevos = input(0);
  /** "Menú": el panel lleva a la galería de platillos. */
  readonly goToMenu = output<void>();
  readonly logout = output<void>();

  protected readonly items = NAV;
}

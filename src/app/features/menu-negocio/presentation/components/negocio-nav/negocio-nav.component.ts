// CL-Sprint4 28/10/2026: HU-07B. Navegación lateral del Panel de Negocio (sidebar naranja; barra inferior en < 960px).
// Solo "Inicio" (este panel) y "Menú" (salta a la galería) existen hoy; el resto se marca "Pronto" hasta su historia.
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
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
  /** `current` = esta página; `menu` = salta a la galería; `soon` = aún no existe. */
  kind: 'current' | 'menu' | 'soon';
}

const NAV: NavItem[] = [
  { icon: 'inicio', label: 'Inicio', kind: 'current' },
  { icon: 'pedidos', label: 'Pedidos', kind: 'soon' },
  { icon: 'menu', label: 'Menú', kind: 'menu' },
  { icon: 'promociones', label: 'Promociones', kind: 'soon' },
  { icon: 'estadisticas', label: 'Estadísticas', kind: 'soon' },
  { icon: 'perfil', label: 'Perfil del negocio', kind: 'soon' },
  { icon: 'horario', label: 'Horario', kind: 'soon' },
  { icon: 'configuracion', label: 'Configuración', kind: 'soon' },
];

@Component({
  selector: 'app-negocio-nav',
  imports: [NgTemplateOutlet],
  templateUrl: './negocio-nav.component.html',
  styleUrl: './negocio-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NegocioNavComponent {
  /** La cafetería (o `null` mientras carga) para la tarjeta de abajo. */
  readonly cafeteria = input<Cafeteria | null>(null);
  /** "Menú": el panel lleva a la galería de platillos. */
  readonly goToMenu = output<void>();
  readonly logout = output<void>();

  protected readonly items = NAV;
}

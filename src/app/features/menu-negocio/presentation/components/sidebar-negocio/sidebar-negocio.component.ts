// CL-Sprint4 28/10/2026: HU-07B. Columna izquierda del panel: datos del negocio (GET api/cafeterias/{id}, vía CafeteriaFacade)
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Cafeteria } from '@features/cafeterias';

@Component({
  selector: 'app-sidebar-negocio',
  templateUrl: './sidebar-negocio.component.html',
  styleUrl: './sidebar-negocio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarNegocioComponent {
  readonly cafeteria = input.required<Cafeteria>();
}

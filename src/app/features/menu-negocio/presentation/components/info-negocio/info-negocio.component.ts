// CL-Sprint4 28/10/2026: HU-07B. Pestaña "Información" del perfil: datos del negocio (GET api/cafeterias/{id}, vía CafeteriaFacade)
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Cafeteria } from '@features/cafeterias';

@Component({
  selector: 'app-info-negocio',
  imports: [DatePipe],
  templateUrl: './info-negocio.component.html',
  styleUrl: './info-negocio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoNegocioComponent {
  readonly cafeteria = input.required<Cafeteria>();
}

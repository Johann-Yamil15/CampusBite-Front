import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CafeteriaFormComponent } from '../../components/cafeteria-form/cafeteria-form';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, CafeteriaFormComponent], // ¡Importante agregarlo aquí!
  templateUrl: './admin-panel.html',
  styleUrls: ['./admin-panel.scss']
})
export class AdminPanelComponent { }
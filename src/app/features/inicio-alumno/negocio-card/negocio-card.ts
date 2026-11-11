// FB-Sprint4 29/10/2026: Componente de tarjeta expandible para mostrar la información del negocio
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MenuCafeteria } from '@shared/menu/menu.model';
import { ProductoItemComponent } from '../producto-item/producto-item'; // Ajusta la ruta

@Component({
  selector: 'app-negocio-card',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, MatIconModule, ProductoItemComponent],
  templateUrl: './negocio-card.html',
  styleUrl: './negocio-card.scss'
})
export class NegocioCardComponent {
  @Input({ required: true }) negocio!: MenuCafeteria;
}
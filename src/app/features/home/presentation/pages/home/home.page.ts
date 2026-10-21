// JJ-Sprint3 21/10/2026: HU-13 (cascarón visual). Pantalla de inicio del alumno: búsqueda, filtros y
// tarjetas de productos cercanos. Es solo maqueta: los datos son fijos y la búsqueda/filtros no hacen
// nada todavía (sin backend de productos por cafetería aún); se conectan en la siguiente historia.
// Las fotos son de Picsum Photos (stock genérico, no son fotos reales de las cafeterías ni los platillos).
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  ALUMNO_NAV,
  BottomNavComponent,
} from '@shared/ui/bottom-nav/bottom-nav.component';

interface ProductoVitrina {
  nombre: string;
  negocio: string;
  precio: number;
  foto: string;
  calificacion: number;
  tiempoMin: number;
  categoria: string;
}

const CATEGORIAS = ['Todos', 'Comida corrida', 'Tacos', 'Bebidas', 'Postres', 'Snacks'] as const;

const PRODUCTOS: ProductoVitrina[] = [
  { nombre: 'Combo del día', negocio: 'Cafetería Central', precio: 65, foto: 'https://picsum.photos/seed/cb-combo1/480/360', calificacion: 4.8, tiempoMin: 12, categoria: 'Comida corrida' },
  { nombre: 'Tacos de guisado (3)', negocio: 'Cafetería Central', precio: 45, foto: 'https://picsum.photos/seed/cb-tacos1/480/360', calificacion: 4.6, tiempoMin: 10, categoria: 'Tacos' },
  { nombre: 'Café americano 12oz', negocio: 'Snacks & Baguettes El Lobo', precio: 25, foto: 'https://picsum.photos/seed/cb-cafe1/480/360', calificacion: 4.9, tiempoMin: 5, categoria: 'Bebidas' },
  { nombre: 'Baguette de pavo', negocio: 'Snacks & Baguettes El Lobo', precio: 55, foto: 'https://picsum.photos/seed/cb-baguette1/480/360', calificacion: 4.7, tiempoMin: 8, categoria: 'Comida corrida' },
  { nombre: 'Frappé de moka', negocio: 'Express Coffee & Donas', precio: 48, foto: 'https://picsum.photos/seed/cb-frappe1/480/360', calificacion: 4.5, tiempoMin: 7, categoria: 'Bebidas' },
  { nombre: 'Dona glaseada (2)', negocio: 'Express Coffee & Donas', precio: 30, foto: 'https://picsum.photos/seed/cb-dona1/480/360', calificacion: 4.4, tiempoMin: 4, categoria: 'Postres' },
  { nombre: 'Comida corrida completa', negocio: 'Cocina Doña Lupe', precio: 60, foto: 'https://picsum.photos/seed/cb-corrida1/480/360', calificacion: 4.9, tiempoMin: 15, categoria: 'Comida corrida' },
  { nombre: 'Papas gajo', negocio: 'Cafetería Central', precio: 35, foto: 'https://picsum.photos/seed/cb-papas1/480/360', calificacion: 4.3, tiempoMin: 6, categoria: 'Snacks' },
];

@Component({
  selector: 'app-home-page',
  imports: [CurrencyPipe, BottomNavComponent],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly nav = ALUMNO_NAV;
  protected readonly categorias = CATEGORIAS;
  protected readonly productos = PRODUCTOS;
}

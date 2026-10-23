// JJ-Sprint3 22/10/2026: HU-13 (cascarón visual, v2). Réplica del diseño de referencia del alumno:
// sidebar de navegación + topbar (buscador, cafetería activa, carrito, usuario) + banner + categorías +
// cafeterías destacadas + menú + panel derecho (mi pedido, promo, favoritas). Es solo maqueta: todos los
// datos son fijos y ningún botón hace nada todavía (buscar, filtrar, agregar al carrito, guardar favorito);
// se conectan en las siguientes historias. Las fotos son de Picsum Photos (stock genérico).
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

type NavIcono = 'inicio' | 'explorar' | 'pedidos' | 'favoritos' | 'mensajes' | 'perfil';

interface NavItem {
  icono: NavIcono;
  etiqueta: string;
  enlace: string;
  exacto?: boolean;
  insignia?: number;
}

type CategoriaIcono = 'todos' | 'desayunos' | 'bebidas' | 'snacks' | 'comidas' | 'saludable' | 'promos';

interface CategoriaPill {
  nombre: string;
  icono: CategoriaIcono;
}

interface CafeteriaDestacada {
  nombre: string;
  foto: string;
  destacada?: boolean;
}

interface ProductoMenu {
  nombre: string;
  descripcion: string;
  negocio: string;
  logoNegocio: string;
  foto: string;
  calificacion: number;
  precio: number;
}

interface ItemCarrito {
  nombre: string;
  negocio: string;
  foto: string;
  cantidad: number;
  precio: number;
}

interface PromoDestacada {
  etiqueta: string;
  titulo: string;
  subtitulo: string;
  foto: string;
}

interface CafeteriaFavorita {
  nombre: string;
  foto: string;
  calificacion: number;
  favorita: boolean;
}

const NAV: NavItem[] = [
  { icono: 'inicio', etiqueta: 'Inicio', enlace: '/', exacto: true },
  { icono: 'explorar', etiqueta: 'Explorar', enlace: '/buscar' },
  { icono: 'pedidos', etiqueta: 'Pedidos', enlace: '/pedidos' },
  { icono: 'favoritos', etiqueta: 'Favoritos', enlace: '/favoritos' },
  { icono: 'mensajes', etiqueta: 'Mensajes', enlace: '/mensajes', insignia: 3 },
  { icono: 'perfil', etiqueta: 'Perfil', enlace: '/perfil' },
];

const CATEGORIAS: CategoriaPill[] = [
  { nombre: 'Todos', icono: 'todos' },
  { nombre: 'Desayunos', icono: 'desayunos' },
  { nombre: 'Bebidas', icono: 'bebidas' },
  { nombre: 'Snacks', icono: 'snacks' },
  { nombre: 'Comidas', icono: 'comidas' },
  { nombre: 'Saludable', icono: 'saludable' },
  { nombre: 'Promos', icono: 'promos' },
];

const CAFETERIAS_DESTACADAS: CafeteriaDestacada[] = [
  { nombre: 'Cafetería Central', foto: 'https://picsum.photos/seed/cb-dest-central/160/160', destacada: true },
  { nombre: 'La Terraza', foto: 'https://picsum.photos/seed/cb-dest-terraza/160/160' },
  { nombre: 'Rincón Verde', foto: 'https://picsum.photos/seed/cb-dest-rincon/160/160' },
  { nombre: 'Sabor Universitario', foto: 'https://picsum.photos/seed/cb-dest-sabor/160/160' },
  { nombre: 'Café Express', foto: 'https://picsum.photos/seed/cb-dest-express/160/160' },
  { nombre: 'Snack Point', foto: 'https://picsum.photos/seed/cb-dest-snack/160/160' },
  { nombre: 'Delis & Más', foto: 'https://picsum.photos/seed/cb-dest-delis/160/160' },
  { nombre: 'Bowl Saludable', foto: 'https://picsum.photos/seed/cb-dest-bowl/160/160' },
];

const MENU: ProductoMenu[] = [
  { nombre: 'Sándwich Clásico de Pollo', descripcion: 'Pan artesanal, pollo, lechuga, jitomate y aderezo de la casa.', negocio: 'Cafetería Central', logoNegocio: 'https://picsum.photos/seed/cb-logo-central/80/80', foto: 'https://picsum.photos/seed/cb-menu-sandwich/480/360', calificacion: 4.8, precio: 55 },
  { nombre: 'Latte Helado', descripcion: 'Café espresso con leche y hielo. 355 ml.', negocio: 'Café Express', logoNegocio: 'https://picsum.photos/seed/cb-logo-express/80/80', foto: 'https://picsum.photos/seed/cb-menu-latte/480/360', calificacion: 4.7, precio: 38 },
  { nombre: 'Bowl de Pollo', descripcion: 'Arroz integral, pollo a la plancha, aguacate, vegetales y aderezo.', negocio: 'Rincón Verde', logoNegocio: 'https://picsum.photos/seed/cb-logo-rincon/80/80', foto: 'https://picsum.photos/seed/cb-menu-bowlpollo/480/360', calificacion: 4.9, precio: 72 },
  { nombre: 'Hamburguesa Clásica', descripcion: 'Carne de res, queso, lechuga, jitomate y papas.', negocio: 'Sabor Universitario', logoNegocio: 'https://picsum.photos/seed/cb-logo-sabor/80/80', foto: 'https://picsum.photos/seed/cb-menu-hamburguesa/480/360', calificacion: 4.6, precio: 79 },
  { nombre: 'Smoothie de Frutos Rojos', descripcion: 'Fresa, plátano, avena y yogurt.', negocio: 'Bowl Saludable', logoNegocio: 'https://picsum.photos/seed/cb-logo-bowl/80/80', foto: 'https://picsum.photos/seed/cb-menu-smoothie/480/360', calificacion: 4.8, precio: 45 },
  { nombre: 'Chilaquiles Verdes', descripcion: 'Con pollo, crema, queso y cebolla.', negocio: 'La Terraza', logoNegocio: 'https://picsum.photos/seed/cb-logo-terraza/80/80', foto: 'https://picsum.photos/seed/cb-menu-chilaquiles/480/360', calificacion: 4.6, precio: 58 },
  { nombre: 'Papas a la Francesa', descripcion: 'Papas crujientes con aderezo de la casa.', negocio: 'Snack Point', logoNegocio: 'https://picsum.photos/seed/cb-logo-snack/80/80', foto: 'https://picsum.photos/seed/cb-menu-papas/480/360', calificacion: 4.5, precio: 32 },
  { nombre: 'Panini Caprese', descripcion: 'Pan artesanal, queso mozzarella, jitomate, albahaca y pesto.', negocio: 'Delis & Más', logoNegocio: 'https://picsum.photos/seed/cb-logo-delis/80/80', foto: 'https://picsum.photos/seed/cb-menu-panini/480/360', calificacion: 4.7, precio: 49 },
];

const CARRITO: ItemCarrito[] = [
  { nombre: 'Hamburguesa Clásica', negocio: 'Sabor Universitario', foto: 'https://picsum.photos/seed/cb-menu-hamburguesa/120/120', cantidad: 1, precio: 79 },
  { nombre: 'Latte Helado', negocio: 'Café Express', foto: 'https://picsum.photos/seed/cb-menu-latte/120/120', cantidad: 1, precio: 38 },
];

const PROMO: PromoDestacada = {
  etiqueta: 'Promos de hoy',
  titulo: 'Combo Estudiantil',
  subtitulo: 'Hamburguesa + bebida por solo $99',
  foto: 'https://picsum.photos/seed/cb-promo-combo/200/200',
};

const FAVORITAS: CafeteriaFavorita[] = [
  { nombre: 'Cafetería Central', foto: 'https://picsum.photos/seed/cb-dest-central/80/80', calificacion: 4.8, favorita: true },
  { nombre: 'Rincón Verde', foto: 'https://picsum.photos/seed/cb-dest-rincon/80/80', calificacion: 4.9, favorita: false },
  { nombre: 'Café Express', foto: 'https://picsum.photos/seed/cb-dest-express/80/80', calificacion: 4.7, favorita: true },
  { nombre: 'Snack Point', foto: 'https://picsum.photos/seed/cb-dest-snack/80/80', calificacion: 4.5, favorita: false },
];

@Component({
  selector: 'app-home-page',
  imports: [CurrencyPipe, RouterLink, RouterLinkActive],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly nav = NAV;
  protected readonly categorias = CATEGORIAS;
  protected readonly cafeteriasDestacadas = CAFETERIAS_DESTACADAS;
  protected readonly menu = MENU;
  protected readonly carrito = CARRITO;
  protected readonly promo = PROMO;
  protected readonly favoritas = FAVORITAS;

  protected readonly usuario = { nombre: 'Juan Pérez', foto: 'https://picsum.photos/seed/cb-user-juan/96/96' };
  protected readonly cafeteriaActiva = 'Cafetería Central';

  protected get totalCarrito(): number {
    return this.carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  }

  protected get totalItemsCarrito(): number {
    return this.carrito.reduce((suma, item) => suma + item.cantidad, 0);
  }
}

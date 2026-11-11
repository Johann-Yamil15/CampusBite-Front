// CL-Sprint5 11/11/2026: catálogo vivo del sistema de diseño (/sistema-diseno, solo en desarrollo: la ruta
// tiene canMatch con isDevMode). Muestra cada pieza con sus estados para revisarla en claro y en oscuro
// sin navegar por toda la app. No es una pantalla del producto: nada aquí habla con el back.
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ICONOS, NombreIcono } from '@shared/ui/icon/icons';
import { CantidadComponent } from '@shared/ui/cantidad/cantidad.component';
import { CalificacionComponent } from '@shared/ui/calificacion/calificacion.component';

interface Muestra {
  token: string;
  nombre: string;
  /** Token del texto que va encima, si lo hay. */
  sobre?: string;
}

const COLORES: { grupo: string; muestras: Muestra[] }[] = [
  {
    grupo: 'Marca y acción',
    muestras: [
      { token: '--cb-action', nombre: 'Acción', sobre: '--cb-on-action' },
      { token: '--cb-primary', nombre: 'Texto de marca' },
      { token: '--cb-primary-container', nombre: 'Naranja vivo (superficies)' },
      { token: '--cb-brand-soft', nombre: 'Marca suave', sobre: '--cb-primary' },
      { token: '--cb-promo', nombre: 'Promo (mango)', sobre: '--cb-on-promo' },
    ],
  },
  {
    grupo: 'Estado',
    muestras: [
      { token: '--cb-success-soft', nombre: 'Éxito', sobre: '--cb-success' },
      { token: '--cb-danger-soft', nombre: 'Error', sobre: '--cb-danger' },
      { token: '--cb-danger-action', nombre: 'Peligro (botón)', sobre: '--cb-on-danger-action' },
    ],
  },
  {
    grupo: 'Superficies y texto',
    muestras: [
      { token: '--cb-bg', nombre: 'Fondo', sobre: '--cb-ink' },
      { token: '--cb-surface', nombre: 'Superficie', sobre: '--cb-ink' },
      { token: '--cb-surface-low', nombre: 'Superficie baja', sobre: '--cb-ink-soft' },
      { token: '--cb-surface-high', nombre: 'Superficie alta', sobre: '--cb-text-muted' },
      { token: '--cb-line', nombre: 'Línea' },
    ],
  },
];

const TIPOS = [
  { token: '--cb-text-3xl', uso: 'Título de pantalla' },
  { token: '--cb-text-2xl', uso: 'Título de sección grande' },
  { token: '--cb-text-xl', uso: 'Encabezado de sección' },
  { token: '--cb-text-lg', uso: 'Título de tarjeta' },
  { token: '--cb-text-md', uso: 'Cuerpo' },
  { token: '--cb-text-sm', uso: 'Metadatos, botones chicos' },
  { token: '--cb-text-xs', uso: 'Insignias (nunca párrafos)' },
];

const CATEGORIAS = ['Todos', 'Desayunos', 'Comidas', 'Bebidas', 'Snacks', 'Saludable'];

@Component({
  selector: 'app-sistema-diseno-page',
  imports: [CurrencyPipe, ModalComponent, IconComponent, CantidadComponent, CalificacionComponent],
  templateUrl: './sistema-diseno.page.html',
  styleUrl: './sistema-diseno.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SistemaDisenoPage {
  protected readonly toast = inject(ToastService);

  protected readonly colores = COLORES;
  protected readonly tipos = TIPOS;
  protected readonly categorias = CATEGORIAS;
  protected readonly iconos = Object.keys(ICONOS) as NombreIcono[];

  protected readonly categoria = signal('Todos');
  protected readonly enCarrito = signal(0);
  protected readonly favorito = signal(false);
  protected readonly cargando = signal(false);
  protected readonly modal = signal(false);
  protected readonly avisos = signal(true);

  protected agregar(): void {
    this.enCarrito.set(1);
    this.toast.ok('Chilaquiles Verdes se agregó a tu carrito.');
  }

  protected quitarDelCarrito(): void {
    this.enCarrito.set(0);
    this.toast.info('Quitaste Chilaquiles Verdes del carrito.');
  }

  protected alternarFavorito(): void {
    this.favorito.update((v) => !v);
    this.toast.info(this.favorito() ? 'Guardado en favoritos.' : 'Quitado de favoritos.');
  }

  /** Muestra el esqueleto de carga 2 segundos, como lo verá el alumno mientras llega el menú. */
  protected simularCarga(): void {
    this.cargando.set(true);
    setTimeout(() => this.cargando.set(false), 2000);
  }

  protected boton(nombre: string): void {
    this.toast.info(`Tocaste "${nombre}".`);
  }
}

// CL-Sprint5 11/11/2026: catálogo vivo del sistema de diseño (/sistema-diseno, solo en desarrollo: la ruta
// tiene canMatch con isDevMode). Muestra cada pieza con sus estados para revisarla en claro y en oscuro
// sin navegar por toda la app. No es una pantalla del producto: nada aquí habla con el back.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ICONOS, NombreIcono } from '@shared/ui/icon/icons';
import { CantidadComponent } from '@shared/ui/cantidad/cantidad.component';
import { CalificacionComponent } from '@shared/ui/calificacion/calificacion.component';

/**
 * `fondo`: se pinta de ese color y, si tiene `sobre`, con su texto encima.
 * `texto`: es un color de texto; se muestra "Aa" de ese color sobre la superficie.
 * `linea`: es un color de borde (decorativo, no lleva texto); se muestra como borde grueso.
 */
interface Muestra {
  token: string;
  nombre: string;
  tipo: 'fondo' | 'texto' | 'linea';
  sobre?: string;
}

/** Fondos donde la app pone texto con --cb-primary (enlaces, chips activos, pestañas, títulos). */
const FONDOS_DE_MARCA = [
  { token: '--cb-bg', nombre: 'Fondo' },
  { token: '--cb-surface', nombre: 'Superficie' },
  { token: '--cb-surface-low', nombre: 'Superficie baja' },
  { token: '--cb-surface-high', nombre: 'Superficie alta' },
  { token: '--cb-brand-soft', nombre: 'Marca suave' },
];

interface Contraste {
  fondo: string;
  nombre: string;
  ratio: number;
}

const COLORES: { grupo: string; muestras: Muestra[] }[] = [
  {
    grupo: 'Marca y acción',
    muestras: [
      { token: '--cb-action', nombre: 'Acción', tipo: 'fondo', sobre: '--cb-on-action' },
      { token: '--cb-primary', nombre: 'Texto de marca', tipo: 'texto' },
      {
        token: '--cb-primary-container',
        nombre: 'Naranja vivo (superficies)',
        tipo: 'fondo',
        sobre: '--cb-on-primary-container',
      },
      { token: '--cb-brand-soft', nombre: 'Marca suave', tipo: 'fondo', sobre: '--cb-primary' },
      { token: '--cb-promo', nombre: 'Promo (mango)', tipo: 'fondo', sobre: '--cb-on-promo' },
      { token: '--cb-disabled', nombre: 'Deshabilitado', tipo: 'fondo', sobre: '--cb-on-disabled' },
    ],
  },
  {
    grupo: 'Estado',
    muestras: [
      { token: '--cb-success-soft', nombre: 'Éxito', tipo: 'fondo', sobre: '--cb-success' },
      { token: '--cb-danger-soft', nombre: 'Error', tipo: 'fondo', sobre: '--cb-danger' },
      {
        token: '--cb-danger-action',
        nombre: 'Peligro (botón)',
        tipo: 'fondo',
        sobre: '--cb-on-danger-action',
      },
    ],
  },
  {
    grupo: 'Superficies y texto',
    muestras: [
      { token: '--cb-bg', nombre: 'Fondo', tipo: 'fondo', sobre: '--cb-ink' },
      { token: '--cb-surface', nombre: 'Superficie', tipo: 'fondo', sobre: '--cb-ink' },
      { token: '--cb-surface-low', nombre: 'Superficie baja', tipo: 'fondo', sobre: '--cb-ink-soft' },
      { token: '--cb-surface-high', nombre: 'Superficie alta', tipo: 'fondo', sobre: '--cb-text-muted' },
      { token: '--cb-text-muted', nombre: 'Texto secundario', tipo: 'texto' },
      { token: '--cb-line', nombre: 'Línea (borde)', tipo: 'linea' },
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

  /** Contraste de --cb-primary sobre cada fondo, medido en vivo con el tema activo. */
  protected readonly contrastes = signal<Contraste[]>([]);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const medir = () => this.contrastes.set(medirContrastes('--cb-primary', FONDOS_DE_MARCA));
      medir();
      // Si el sistema cambia de claro a oscuro con la página abierta, se vuelve a medir
      const tema = matchMedia('(prefers-color-scheme: dark)');
      tema.addEventListener('change', medir);
      destroyRef.onDestroy(() => tema.removeEventListener('change', medir));
    });
  }

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

// ---------- Medición de contraste (WCAG 2.x) ----------

/** Color calculado de un token (el navegador lo resuelve a rgb() con el tema activo). */
function colorDe(token: string): [number, number, number] {
  const prueba = document.createElement('span');
  prueba.style.color = `var(${token})`;
  document.body.append(prueba);
  const rgb = getComputedStyle(prueba).color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
  prueba.remove();
  return [rgb[0], rgb[1], rgb[2]];
}

function luminancia([r, g, b]: [number, number, number]): number {
  const lineal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);
}

function medirContrastes(texto: string, fondos: { token: string; nombre: string }[]): Contraste[] {
  const lt = luminancia(colorDe(texto));
  return fondos.map(({ token, nombre }) => {
    const lf = luminancia(colorDe(token));
    const ratio = (Math.max(lt, lf) + 0.05) / (Math.min(lt, lf) + 0.05);
    return { fondo: token, nombre, ratio: Math.round(ratio * 100) / 100 };
  });
}

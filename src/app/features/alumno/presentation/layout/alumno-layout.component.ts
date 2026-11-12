// JY-Sprint4 05/11/2026: chrome común de las pantallas del alumno (sidebar + topbar) con un <router-outlet>
// para cada sección, para que la navegación se sienta una sola app y no una página suelta por ruta.
//
// CL-Sprint5 11/11/2026: etapa 2 del rediseño. Navegación responsiva con el sistema de diseño:
//   - Teléfono (< 600px): barra superior compacta + barra inferior de 5 secciones (alcance del pulgar).
//   - Tableta (600–959px): riel lateral de íconos con su etiqueta.
//   - Escritorio (≥ 960px): sidebar completo, como el Panel de Negocio.
// Menú de usuario con "Cerrar sesión" (confirmado con un modal) en todos los tamaños, y el carrito vive
// aquí: solo lo ven los alumnos (antes app.ts lo ponía para cualquier sesión, también al encargado).
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthFacade } from '@features/auth';
import { MisPedidosFacade } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NombreIcono } from '@shared/ui/icon/icons';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';
import { nombreDesdeCorreo } from '@features/alumno/presentation/nombre';
import { CarritoDrawerComponent } from '@features/alumno/presentation/components/carrito-drawer/carrito-drawer.component';
import { CheckoutComponent } from '@features/alumno/presentation/components/checkout/checkout.component';

interface NavItem {
  icono: NombreIcono;
  etiqueta: string;
  enlace: string;
  /** Inicio ("/") no debe quedar activo en las demás secciones. */
  exacto?: boolean;
}

const NAV: NavItem[] = [
  { icono: 'inicio', etiqueta: 'Inicio', enlace: '/', exacto: true },
  { icono: 'buscar', etiqueta: 'Buscar', enlace: '/buscar' },
  { icono: 'pedidos', etiqueta: 'Pedidos', enlace: '/pedidos' },
  { icono: 'corazon', etiqueta: 'Favoritos', enlace: '/favoritos' },
  { icono: 'perfil', etiqueta: 'Perfil', enlace: '/perfil' },
];

@Component({
  selector: 'app-alumno-layout',
  imports: [
    CurrencyPipe,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    IconComponent,
    ModalComponent,
    CarritoDrawerComponent,
    CheckoutComponent,
  ],
  templateUrl: './alumno-layout.component.html',
  styleUrl: './alumno-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'clicFuera($event)',
    '(document:keydown.escape)': 'cerrarMenu()',
  },
})
export class AlumnoLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);
  private readonly pedidos = inject(MisPedidosFacade);
  private readonly favoritos = inject(FavoritosFacade);
  protected readonly carrito = inject(CarritoStore);

  protected readonly nav = NAV;

  /** Insignia de "Pedidos": cuántos siguen en curso. */
  protected readonly enCurso = computed(() => this.pedidos.enCurso().length);

  protected readonly correo = computed(() => this.auth.user()?.email ?? null);
  protected readonly nombre = computed(() => nombreDesdeCorreo(this.correo()));
  protected readonly primerNombre = computed(() => this.nombre().split(' ')[0]);
  protected readonly iniciales = computed(() =>
    this.nombre()
      .split(' ')
      .slice(0, 2)
      .map((p) => p.charAt(0))
      .join(''),
  );

  /** Abierto/cerrado del drawer: lo comparten la barra, la barra "Ver carrito" y las pantallas. */
  private readonly carritoUi = inject(CarritoUiService);
  protected readonly carritoAbierto = this.carritoUi.abierto;
  /** Etapa 5: el checkout (modal) también vive en el layout. */
  protected readonly checkoutAbierto = this.carritoUi.checkoutAbierto;
  protected readonly menuAbierto = signal(false);
  protected readonly confirmandoSalida = signal(false);

  private readonly menu = viewChild<ElementRef<HTMLElement>>('menuUsuario');

  constructor() {
    // La insignia y el perfil necesitan los pedidos aunque no se abra /pedidos
    this.pedidos.cargar().subscribe({ error: () => undefined });
    // CL-Sprint5 11/11/2026 (etapa 7): los corazones de todas las pantallas leen estos favoritos
    this.favoritos.cargar().subscribe({ error: () => undefined });

    // Tras recargar la página la sesión sigue (token) pero el usuario no está en memoria: se pide a /me
    // para el saludo. Si falla, se saluda como "Alumno"; un 401 ya lo maneja el errorInterceptor.
    if (!this.auth.user()) this.auth.loadCurrentUser().subscribe({ error: () => undefined });

    // Al cambiar de pantalla se cierran el menú y el carrito
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAbierto.set(false);
        this.carritoAbierto.set(false);
      });
  }

  /** El buscador de la barra superior manda el texto a /buscar como query param. */
  protected buscar(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const q = new FormData(form).get('q')?.toString().trim() ?? '';
    void this.router.navigate(['/buscar'], { queryParams: q ? { q } : {} });
  }

  protected abrirCarrito(): void {
    this.menuAbierto.set(false);
    this.carritoAbierto.set(true);
  }

  protected alternarMenu(event: Event): void {
    event.stopPropagation();
    this.menuAbierto.update((v) => !v);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected clicFuera(event: MouseEvent): void {
    if (!this.menuAbierto()) return;
    const menu = this.menu()?.nativeElement;
    if (menu && !menu.contains(event.target as Node)) this.menuAbierto.set(false);
  }

  protected pedirSalida(): void {
    this.menuAbierto.set(false);
    this.confirmandoSalida.set(true);
  }

  /** Cierra la sesión. El carrito lo vacía app.ts al ver que ya no hay sesión. */
  protected salir(): void {
    this.confirmandoSalida.set(false);
    this.auth.logout();
  }
}

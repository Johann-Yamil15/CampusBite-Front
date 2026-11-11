// JY-Sprint4 05/11/2026: cascarón visual. Chrome común de las pantallas del alumno (sidebar + topbar) con
// un <router-outlet> para la pantalla de cada sección. Lo usa el flujo de /buscar, /pedidos, /favoritos y
// /perfil para que la navegación se sienta una sola app y no una página suelta por ruta.
// shortcut: duplica el chrome de home.page (HU-13 de JJ) en vez de que esa página lo use; se unifica
// cuando /inicio y / se fusionen en una sola pantalla real con datos del back.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MisPedidosFacade } from '@features/ordenes';

type NavIcono = 'inicio' | 'explorar' | 'pedidos' | 'favoritos' | 'perfil';

interface NavItem {
  icono: NavIcono;
  etiqueta: string;
  enlace: string;
  exacto?: boolean;
}

const NAV: NavItem[] = [
  { icono: 'inicio', etiqueta: 'Inicio', enlace: '/inicio' },
  { icono: 'explorar', etiqueta: 'Buscar', enlace: '/buscar' },
  { icono: 'pedidos', etiqueta: 'Pedidos', enlace: '/pedidos' },
  { icono: 'favoritos', etiqueta: 'Favoritos', enlace: '/favoritos' },
  { icono: 'perfil', etiqueta: 'Perfil', enlace: '/perfil' },
];

@Component({
  selector: 'app-alumno-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './alumno-layout.component.html',
  styleUrl: './alumno-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlumnoLayoutComponent {
  private readonly router = inject(Router);
  private readonly pedidos = inject(MisPedidosFacade);

  protected readonly nav = NAV;

  /** Insignia de "Pedidos": cuántos siguen en curso. */
  protected readonly enCurso = this.pedidos.enCurso;

  constructor() {
    // CL-Sprint5 11/11/2026: la insignia y el perfil necesitan los pedidos aunque no se abra /pedidos
    this.pedidos.cargar().subscribe({ error: () => undefined });
  }

  // Cascarón: el nombre real sale del token cuando se conecte el perfil (HU futura)
  protected readonly usuario = {
    nombre: 'Juan Pérez',
    foto: 'https://picsum.photos/seed/cb-user-juan/96/96',
  };

  /** El buscador de la topbar manda el texto a /buscar como query param. */
  protected buscar(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const q = new FormData(form).get('q')?.toString().trim() ?? '';
    void this.router.navigate(['/buscar'], { queryParams: q ? { q } : {} });
  }
}

// JY-Sprint4 05/11/2026: chrome común de las secciones nuevas del Panel de Negocio (Pedidos, Promociones,
// Estadísticas, Horario): reusa el sidebar de CL y pone un <router-outlet> para cada pantalla.
// shortcut: el panel de Inicio (panel-negocio.page) trae su propio chrome y no pasa por aquí; se unifica
// cuando esa página se parta en secciones y deje de ser una sola pantalla.
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { AuthFacade } from '@features/auth';
import { CafeteriaFacade } from '@features/cafeterias';
import { NegocioNavComponent } from '@features/menu-negocio/presentation/components/negocio-nav/negocio-nav.component';

@Component({
  selector: 'app-negocio-layout',
  imports: [RouterOutlet, NegocioNavComponent],
  templateUrl: './negocio-layout.component.html',
  styleUrl: './negocio-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NegocioLayoutComponent implements OnInit {
  /** Id de la cafetería del encargado; lo resuelve `/mi-negocio` y las subrutas lo heredan. */
  readonly id = input<string>('');

  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly cafeterias = inject(CafeteriaFacade);

  ngOnInit(): void {
    const id = this.id();
    if (!id || this.cafeterias.selected()?.id === id) return;

    // Solo para el nombre del negocio en el sidebar: si falla, la tarjeta dice "Mi negocio"
    this.cafeterias
      .loadById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected logout(): void {
    this.auth.logout();
  }

  /** "Menú" del sidebar: la galería de platillos vive en el panel de Inicio. */
  protected goToMenu(): void {
    void this.router.navigate(['/mi-negocio']);
  }
}

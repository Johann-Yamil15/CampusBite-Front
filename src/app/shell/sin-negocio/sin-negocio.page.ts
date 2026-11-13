// CL-Sprint5 11/11/2026: /negocio. A esta ruta manda cafeteriaDelEncargadoResolver (feature auth) cuando no
// encuentra la cafetería del encargado (CL-Sprint5 13/11/2026: login y /me ya traen idCafeteria; queda para
// un encargado sin cafetería o un /me que falla).
// Antes aquí había una maqueta de un perfil de negocio con datos inventados, que hacía creer que el panel
// había cargado. Ahora se dice la verdad y se ofrece reintentar o salir.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '@features/auth';
import { IconComponent } from '@shared/ui/icon/icon.component';

@Component({
  selector: 'app-sin-negocio-page',
  imports: [IconComponent],
  template: `
    <main class="sn">
      <section class="sn-tarjeta cb-card" aria-labelledby="sn-titulo">
        <img src="assets/images/logo-campusbite.png" alt="" width="56" height="56" />
        <h1 id="sn-titulo">No pudimos abrir tu negocio</h1>
        <p>
          Tu cuenta es de encargado, pero no encontramos la cafetería que tienes asignada. Puede ser un
          problema de conexión o que todavía no te hayan dado de alta en una.
        </p>
        <div class="sn-acciones">
          <button type="button" class="cb-btn cb-btn--primary" (click)="reintentar()">
            <app-icon nombre="recargar" />
            Reintentar
          </button>
          <button type="button" class="cb-btn cb-btn--secondary" (click)="salir()">
            <app-icon nombre="salir" />
            Cerrar sesión
          </button>
        </div>
        <p class="sn-ayuda">Si el problema sigue, pide al administrador que revise tu cafetería.</p>
      </section>
    </main>
  `,
  styles: `
    .sn {
      display: grid;
      place-items: center;
      min-height: 100dvh;
      padding: var(--cb-gutter);
      background: var(--cb-bg);
    }
    .sn-tarjeta {
      max-width: 28rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--cb-space-md);
      text-align: center;
    }
    img {
      border-radius: var(--cb-radius);
    }
    h1 {
      margin: 0;
      font-size: var(--cb-text-xl);
      font-weight: 800;
      color: var(--cb-ink);
    }
    p {
      margin: 0;
      color: var(--cb-text-muted);
    }
    .sn-acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--cb-space-sm);
    }
    .sn-ayuda {
      font-size: var(--cb-text-sm);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinNegocioPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);

  protected reintentar(): void {
    void this.router.navigate(['/mi-negocio']);
  }

  protected salir(): void {
    this.auth.logout();
  }
}

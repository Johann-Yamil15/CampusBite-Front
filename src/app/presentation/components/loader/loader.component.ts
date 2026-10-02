import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LoadingService } from '@core/services/loading.service';

/** Barra de progreso global ligada a las peticiones HTTP en curso. */
@Component({
  selector: 'app-loader',
  template: `
    @if (loading.isLoading()) {
      <div class="loader" role="progressbar" aria-label="Cargando"></div>
    }
  `,
  styles: `
    .loader {
      position: fixed;
      inset: 0 0 auto;
      height: 3px;
      z-index: 1000;
      background: linear-gradient(90deg, transparent, var(--cb-primary), transparent);
      background-size: 200% 100%;
      animation: slide 1s linear infinite;
    }
    @keyframes slide {
      from {
        background-position: 200% 0;
      }
      to {
        background-position: -200% 0;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoaderComponent {
  protected readonly loading = inject(LoadingService);
}

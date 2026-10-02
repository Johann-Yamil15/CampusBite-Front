import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <main class="stack" style="text-align: center; padding: 4rem 1rem">
      <h1>404</h1>
      <p class="muted">La página que buscas no existe.</p>
      <a routerLink="/" class="btn">Volver al inicio</a>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}

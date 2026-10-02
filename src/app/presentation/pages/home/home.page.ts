import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  template: `
    <section class="stack">
      <h1>Bienvenido a CampusBite</h1>
      <p class="muted">Pide comida en tu campus sin hacer fila.</p>
      <a routerLink="/productos" class="btn">Ver menú</a>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}

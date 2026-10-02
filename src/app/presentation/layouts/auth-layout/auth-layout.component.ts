import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet],
  template: `
    <main class="auth">
      <section class="card">
        <h1 class="brand">CampusBite</h1>
        <router-outlet />
      </section>
    </main>
  `,
  styles: `
    .auth {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: 1rem;
    }
    .card {
      width: min(100%, 380px);
    }
    .brand {
      color: var(--cb-primary);
      text-align: center;
      margin-top: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}

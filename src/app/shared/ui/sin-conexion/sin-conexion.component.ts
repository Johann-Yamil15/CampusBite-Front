// JJ-Sprint5 27/11/2026: franja fija mientras no hay internet. La app sigue mostrando lo último guardado
// (menú, pedidos con su código, favoritos y perfil) y no deja enviar acciones.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConexionService } from '@core/services/conexion.service';

@Component({
  selector: 'app-sin-conexion',
  template: `
    @if (!conexion.enLinea()) {
      <div class="sin-conexion" role="status" aria-live="polite">
        <strong>Sin conexión.</strong>
        Estás viendo tu última información guardada; para pedir o hacer cambios necesitas internet.
      </div>
    }
  `,
  styles: `
    .sin-conexion {
      position: fixed;
      inset: auto 0 0 0;
      z-index: 1000;
      padding: 12px 16px;
      background: #2b2b2b;
      color: #fbf8f2;
      font-size: 15px;
      line-height: 1.4;
      text-align: center;
      box-shadow: 0 -2px 8px rgb(0 0 0 / 25%);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinConexionComponent {
  protected readonly conexion = inject(ConexionService);
}

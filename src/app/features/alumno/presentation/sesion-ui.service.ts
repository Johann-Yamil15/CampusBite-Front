// CL-Sprint5 11/11/2026 (etapa 8): "Cerrar sesión" con confirmación desde cualquier lugar del alumno (menú
// del layout y Perfil). La ventana la dibuja el layout; aquí solo vive si está abierta. Mismo patrón que
// CarritoUiService.
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SesionUiService {
  readonly confirmandoSalida = signal(false);

  pedirSalida(): void {
    this.confirmandoSalida.set(true);
  }

  cancelar(): void {
    this.confirmandoSalida.set(false);
  }
}

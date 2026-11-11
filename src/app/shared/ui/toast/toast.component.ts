// JY-Sprint4 05/11/2026: pila de avisos flotantes. Va una sola vez en la raíz (app.ts) y dibuja lo que
// haya en ToastService, así cualquier pantalla avisa sin montar su propio bloque de mensajes.
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
}

// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Cafeterías favoritas del alumno. Quitar de favoritos
// solo cambia la lista en memoria: no hay endpoint de favoritos todavía.
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '@shared/ui/toast/toast.service';
import { CafeteriaFavorita, FAVORITAS } from '@features/alumno/presentation/catalogo.mock';

@Component({
  selector: 'app-favoritos-page',
  imports: [RouterLink],
  templateUrl: './favoritos.page.html',
  styleUrl: './favoritos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritosPage {
  private readonly toast = inject(ToastService);

  protected readonly favoritas = signal<CafeteriaFavorita[]>(FAVORITAS);

  protected quitar(cafeteria: CafeteriaFavorita): void {
    this.favoritas.update((lista) => lista.filter((c) => c.idCafeteria !== cafeteria.idCafeteria));
    this.toast.ok(`${cafeteria.nombre} salió de tus favoritos.`);
  }

  protected restaurar(): void {
    this.favoritas.set(FAVORITAS);
    this.toast.info('Volvimos a poner tus favoritos de siempre.');
  }
}

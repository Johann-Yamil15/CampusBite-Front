// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Cafeterías favoritas del alumno.
// CL-Sprint5 11/11/2026: lee, quita y restaura con FavoritosFacade (repositorio mock hasta que exista el
// endpoint de favoritos).
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { CafeteriaFavorita } from '@features/alumno/domain/models/favorito.model';

@Component({
  selector: 'app-favoritos-page',
  imports: [RouterLink],
  templateUrl: './favoritos.page.html',
  styleUrl: './favoritos.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritosPage implements OnInit {
  private readonly toast = inject(ToastService);
  private readonly favoritos = inject(FavoritosFacade);

  protected readonly favoritas = this.favoritos.cafeterias;
  protected readonly cargando = this.favoritos.cargando;
  protected readonly error = this.favoritos.error;
  protected readonly puedeRestaurar = () => false;

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.favoritos.cargar().subscribe({ error: () => undefined });
  }

  protected quitar(cafeteria: CafeteriaFavorita): void {
    this.favoritos.alternar('cafeteria', cafeteria.idCafeteria).subscribe({
      next: () => this.toast.ok(`${cafeteria.nombre} salió de tus favoritos.`),
      error: (e: ApiError) => this.toast.error(e?.message ?? 'No se pudo quitar de favoritos.'),
    });
  }

  protected restaurar(): void {
    // Se reemplaza en la etapa 7 (parte 2) por el "Deshacer" del aviso
  }
}

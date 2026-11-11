import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import { CafeteriaFavorita } from '@features/alumno/domain/models/favorito.model';
import { IDS_FAVORITAS_DEMO, favoritaDemo } from './favoritos.mock-data';

/** CL-Sprint5 11/11/2026: favoritos simulados en memoria mientras no hay tabla ni endpoint. */
@Injectable()
export class FavoritosMockRepository extends FavoritosRepository {
  private readonly backend = inject(MockBackend);
  private ids = [...IDS_FAVORITAS_DEMO];

  listarCafeterias(): Observable<CafeteriaFavorita[]> {
    return this.backend.responder(() =>
      this.ids.map(favoritaDemo).filter((f): f is CafeteriaFavorita => f !== null),
    );
  }

  agregarCafeteria(idCafeteria: string): Observable<CafeteriaFavorita> {
    return this.backend.responder(() => {
      const favorita = favoritaDemo(idCafeteria);
      if (!favorita) throw new MockHttpError(404, 'La cafetería no existe o no está activa.');
      if (!this.ids.includes(idCafeteria)) this.ids = [...this.ids, idCafeteria];
      return favorita;
    });
  }

  quitarCafeteria(idCafeteria: string): Observable<void> {
    return this.backend.responder(() => {
      this.ids = this.ids.filter((id) => id !== idCafeteria);
    });
  }
}

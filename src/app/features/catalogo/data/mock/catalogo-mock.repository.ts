import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { MenuCafeteria, Promocion } from '@features/catalogo/domain/models/catalogo.model';
import { menuDemo, promocionesDemo } from './catalogo.mock-data';

/**
 * CL-Sprint5 11/11/2026: catálogo simulado con la misma forma que CatalogoHttpRepository.
 * CL-Sprint5 13/11/2026: solo para pruebas (la app usa el back); se enlaza con provideCatalogoMock().
 */
@Injectable()
export class CatalogoMockRepository extends CatalogoRepository {
  private readonly backend = inject(MockBackend);

  listarMenu(): Observable<MenuCafeteria[]> {
    return this.backend.responder(() => menuDemo());
  }

  menuCafeteria(idCafeteria: string): Observable<MenuCafeteria> {
    return this.backend.responder(() => {
      const menu = menuDemo().find((c) => c.idCafeteria === idCafeteria);
      if (!menu) throw new MockHttpError(404, 'La cafetería no existe o no está activa.');
      return menu;
    });
  }

  promociones(): Observable<Promocion[]> {
    return this.backend.responder(() => promocionesDemo());
  }
}

import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { DemoNegocioStore } from '@core/mock/demo-negocio.store';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { MenuCafeteria, Promocion } from '@features/catalogo/domain/models/catalogo.model';
import { menuDemo, promocionesDemo } from './catalogo.mock-data';

/**
 * CL-Sprint5 11/11/2026: catálogo simulado mientras el back no expone GET api/menu. Responde con la misma
 * forma que CatalogoHttpRepository; para conectar el back se cambia `useClass` en catalogo.providers.ts.
 */
@Injectable()
export class CatalogoMockRepository extends CatalogoRepository {
  private readonly backend = inject(MockBackend);
  private readonly negocio = inject(DemoNegocioStore);

  listarMenu(): Observable<MenuCafeteria[]> {
    return this.backend.responder(() => menuDemo(this.negocio));
  }

  menuCafeteria(idCafeteria: string): Observable<MenuCafeteria> {
    return this.backend.responder(() => {
      const menu = menuDemo(this.negocio).find((c) => c.idCafeteria === idCafeteria);
      if (!menu) throw new MockHttpError(404, 'La cafetería no existe o no está activa.');
      return menu;
    });
  }

  promociones(): Observable<Promocion[]> {
    return this.backend.responder(() => promocionesDemo(this.negocio));
  }
}

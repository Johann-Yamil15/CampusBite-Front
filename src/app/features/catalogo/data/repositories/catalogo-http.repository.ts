import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '@core/http/api-client.service';
import { CatalogoRepository } from '@features/catalogo/domain/repositories/catalogo.repository';
import { MenuCafeteria, Promocion } from '@features/catalogo/domain/models/catalogo.model';
import { MenuCafeteriaDto, PromocionDto } from '@features/catalogo/data/dtos/catalogo.dto';
import { CatalogoMapper } from '@features/catalogo/data/mappers/catalogo.mapper';

/**
 * CL-Sprint5 11/11/2026: `api/menu` (sp_menu_cafeteria). Antes era MenuService en shared/menu (FB-Sprint4).
 * CL-Sprint5 13/11/2026: conectado (MenuController del back). GET api/menu/buscar no se usa: el buscador
 * filtra en el front con el menú ya cargado.
 */
@Injectable()
export class CatalogoHttpRepository extends CatalogoRepository {
  private readonly api = inject(ApiClient);

  listarMenu(): Observable<MenuCafeteria[]> {
    return this.api
      .get<MenuCafeteriaDto[]>('menu')
      .pipe(map((dtos) => dtos.map(CatalogoMapper.toDomain)));
  }

  menuCafeteria(idCafeteria: string): Observable<MenuCafeteria> {
    return this.api
      .get<MenuCafeteriaDto>(`menu/${idCafeteria}`)
      .pipe(map(CatalogoMapper.toDomain));
  }

  promociones(): Observable<Promocion[]> {
    return this.api
      .get<PromocionDto[]>('promociones/activas')
      .pipe(map((dtos) => dtos.map(CatalogoMapper.toPromocion)));
  }
}

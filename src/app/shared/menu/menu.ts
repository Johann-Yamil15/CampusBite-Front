// FB-Sprint4 29/10/2026: Servicio HTTP para conectar con sp_menu_cafeteria y listar productos de negocios.
// JY-Sprint4 05/11/2026: pasa por ApiClient en vez de HttpClient + environment.apiUrl, para que la URL de
// la API venga del runtime-config (el mismo build sirve para QA y producción) y los errores lleguen
// normalizados como ApiError.
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap }    from 'rxjs';
import { ApiClient }          from '@core/http/api-client.service';
import { MenuCafeteria }      from './menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly api = inject(ApiClient);

  // FB-Sprint4 01/11/2026: último menú cargado; el drawer global lo usa para los métodos de pago
  private readonly _menu = signal<MenuCafeteria[]>([]);
  readonly menu = this._menu.asReadonly();

  listarMenu(): Observable<MenuCafeteria[]> {
    return this.api.get<MenuCafeteria[]>('menu')
      .pipe(tap(m => this._menu.set(m)));
  }

  menuCafeteria(idCafeteria: string): Observable<MenuCafeteria> {
    return this.api.get<MenuCafeteria>(`menu/${idCafeteria}`);
  }
}

// FB-Sprint4 29/10/2026: Servicio HTTP para conectar con sp_menu_cafeteria y listar productos de negocios.
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { environment }        from '../../environments/environment';
import { Observable, tap }    from 'rxjs';
import { MenuCafeteria }      from '../models/menu.model';

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);

  // FB-Sprint4 01/11/2026: último menú cargado; el drawer global lo usa para los métodos de pago
  private readonly _menu = signal<MenuCafeteria[]>([]);
  readonly menu = this._menu.asReadonly();

  listarMenu(): Observable<MenuCafeteria[]> {
    return this.http.get<MenuCafeteria[]>(`${environment.apiUrl}/menu`)
      .pipe(tap(m => this._menu.set(m)));
  }

  menuCafeteria(idCafeteria: string): Observable<MenuCafeteria> {
    return this.http.get<MenuCafeteria>(`${environment.apiUrl}/menu/${idCafeteria}`);
  }
}

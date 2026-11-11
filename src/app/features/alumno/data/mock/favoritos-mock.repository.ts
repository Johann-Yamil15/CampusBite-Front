import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MockBackend, MockHttpError } from '@core/mock/mock-backend';
import { TokenStorageService } from '@core/services/token-storage.service';
import { readJwtClaim } from '@core/utils/jwt.util';
import { FavoritosRepository } from '@features/alumno/domain/repositories/favoritos.repository';
import {
  CafeteriaFavorita,
  PlatilloFavorito,
} from '@features/alumno/domain/models/favorito.model';
import {
  FilaPlatilloFavorito,
  IDS_FAVORITAS_DEMO,
  favoritaDemo,
  filaPlatilloDemo,
  platilloFavoritoDemo,
  platillosFavoritosDemo,
} from './favoritos.mock-data';

/** Prefijo de la clave en localStorage; se completa con el `sub` del JWT (un juego de favoritos por usuario). */
export const CLAVE_FAVORITOS = 'cb.favoritos.';

interface Guardado {
  /** Más recientes primero. */
  cafeterias: string[];
  platillos: FilaPlatilloFavorito[];
}

/**
 * CL-Sprint5 11/11/2026: favoritos simulados mientras no hay tabla ni endpoint.
 * CL-Sprint5 11/11/2026 (etapa 7): ahora también platillos, y se guardan en localStorage por usuario (clave
 * cb.favoritos.<sub del JWT>), así sobreviven a recargar. La primera vez cada usuario arranca con los de la
 * demo. Si el storage está bloqueado, viven en memoria. Para conectar el back se cambia `useClass` en
 * alumno.providers.ts; las pantallas no cambian.
 */
@Injectable()
export class FavoritosMockRepository extends FavoritosRepository {
  private readonly backend = inject(MockBackend);
  private readonly tokens = inject(TokenStorageService);
  /** Respaldo si localStorage no está disponible. */
  private enMemoria: Guardado | null = null;

  // ---------- Cafeterías ----------

  listarCafeterias(): Observable<CafeteriaFavorita[]> {
    return this.backend.responder(() =>
      this.leer()
        .cafeterias.map(favoritaDemo)
        .filter((f): f is CafeteriaFavorita => f !== null),
    );
  }

  agregarCafeteria(idCafeteria: string): Observable<CafeteriaFavorita> {
    return this.backend.responder(() => {
      const favorita = favoritaDemo(idCafeteria);
      if (!favorita) throw new MockHttpError(404, 'La cafetería no existe o no está activa.');
      const g = this.leer();
      if (!g.cafeterias.includes(idCafeteria)) {
        this.escribir({ ...g, cafeterias: [idCafeteria, ...g.cafeterias] });
      }
      return favorita;
    });
  }

  quitarCafeteria(idCafeteria: string): Observable<void> {
    return this.backend.responder(() => {
      const g = this.leer();
      this.escribir({ ...g, cafeterias: g.cafeterias.filter((id) => id !== idCafeteria) });
    });
  }

  // ---------- Platillos ----------

  listarPlatillos(): Observable<PlatilloFavorito[]> {
    return this.backend.responder(() => this.leer().platillos.map(platilloFavoritoDemo));
  }

  agregarPlatillo(idProducto: string): Observable<PlatilloFavorito> {
    return this.backend.responder(() => {
      const g = this.leer();
      const guardada = g.platillos.find((f) => f.idProducto === idProducto);
      if (guardada) return platilloFavoritoDemo(guardada);
      const fila = filaPlatilloDemo(idProducto);
      if (!fila) throw new MockHttpError(404, 'El producto no existe o ya no está en el menú.');
      this.escribir({ ...g, platillos: [fila, ...g.platillos] });
      return platilloFavoritoDemo(fila);
    });
  }

  quitarPlatillo(idProducto: string): Observable<void> {
    return this.backend.responder(() => {
      const g = this.leer();
      this.escribir({ ...g, platillos: g.platillos.filter((f) => f.idProducto !== idProducto) });
    });
  }

  // ---------- Almacenamiento ----------

  private clave(): string {
    return CLAVE_FAVORITOS + (readJwtClaim(this.tokens.get(), 'sub') ?? 'anonimo');
  }

  private leer(): Guardado {
    try {
      const crudo = localStorage.getItem(this.clave());
      if (crudo) {
        const g = JSON.parse(crudo) as Partial<Guardado>;
        if (Array.isArray(g.cafeterias) && Array.isArray(g.platillos)) {
          return { cafeterias: g.cafeterias, platillos: g.platillos };
        }
      }
      if (crudo === null) return demo();
    } catch {
      return (this.enMemoria ??= demo());
    }
    return demo(); // dato dañado: se empieza de nuevo
  }

  private escribir(g: Guardado): void {
    try {
      localStorage.setItem(this.clave(), JSON.stringify(g));
    } catch {
      this.enMemoria = g;
    }
  }
}

function demo(): Guardado {
  return { cafeterias: [...IDS_FAVORITAS_DEMO], platillos: platillosFavoritosDemo() };
}

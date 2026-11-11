// CL-Sprint5 11/11/2026: favoritos de demostración (antes FAVORITAS en alumno/presentation/catalogo.mock.ts
// de JY-Sprint4). Se arman desde la BD de demostración compartida (core/mock/demo-db.ts).
import { DEMO_CAFETERIA, DEMO_CAFETERIAS, DEMO_PRODUCTOS } from '@core/mock/demo-db';
import { CafeteriaFavorita } from '@features/alumno/domain/models/favorito.model';

/** Las que el alumno demo tiene guardadas al empezar. */
export const IDS_FAVORITAS_DEMO: string[] = [
  DEMO_CAFETERIA.central,
  DEMO_CAFETERIA.rincon,
  DEMO_CAFETERIA.express,
];

/** La favorita tal como la devolvería el back, o `null` si la cafetería no existe. */
export function favoritaDemo(idCafeteria: string): CafeteriaFavorita | null {
  const c = DEMO_CAFETERIAS.find((x) => x.id === idCafeteria);
  if (!c) return null;
  return {
    idCafeteria: c.id,
    nombre: c.nombre,
    foto: c.portada,
    calificacion: c.calificacion,
    puntoEntrega: c.puntoEntrega,
    esDelCampus: c.esDelCampus,
    abierta: c.abierta,
    platillos: DEMO_PRODUCTOS.filter((p) => p.idCafeteria === c.id).length,
  };
}

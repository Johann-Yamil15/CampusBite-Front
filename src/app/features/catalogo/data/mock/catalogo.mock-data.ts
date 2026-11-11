// CL-Sprint5 11/11/2026: menú de demostración (antes alumno/presentation/catalogo.mock.ts de JY-Sprint4),
// armado desde la BD de demostración compartida (core/mock/demo-db.ts) con la forma de sp_menu_cafeteria.
import { DEMO_CAFETERIAS, DEMO_PRODUCTOS, fotoDemo } from '@core/mock/demo-db';
import { MenuCafeteria } from '@features/catalogo/domain/models/catalogo.model';

export function menuDemo(): MenuCafeteria[] {
  return DEMO_CAFETERIAS.map((c) => ({
    idCafeteria: c.id,
    cafeteria: c.nombre,
    esDelCampus: c.esDelCampus,
    puntoEntrega: c.puntoEntrega,
    metodosPago: [...c.metodosPago],
    productos: DEMO_PRODUCTOS.filter((p) => p.idCafeteria === c.id).map((p) => ({
      idProducto: p.id,
      producto: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion,
      precio: p.precio,
      imagenUrl: fotoDemo(p.foto),
    })),
  }));
}

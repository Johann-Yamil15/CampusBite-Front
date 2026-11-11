// CL-Sprint5 11/11/2026: menú de demostración (antes alumno/presentation/catalogo.mock.ts de JY-Sprint4),
// armado desde la BD de demostración compartida (core/mock/demo-db.ts) con la forma de sp_menu_cafeteria.
import { DEMO_CAFETERIAS, DEMO_PRODUCTOS, DEMO_PROMOCIONES, fotoDemo } from '@core/mock/demo-db';
import { MenuCafeteria, Promocion } from '@features/catalogo/domain/models/catalogo.model';

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
      calificacion: p.calificacion,
      minutosPreparacion: p.minutosPreparacion,
      precioAnterior: p.precioAnterior,
      popular: p.popular,
    })),
    logoUrl: c.logo,
    portadaUrl: c.portada,
    calificacion: c.calificacion,
    resenas: c.resenas,
    abierta: c.abierta,
    cierraA: c.cierraA,
    minutosEstimados: c.minutosEstimados,
  }));
}

export function promocionesDemo(): Promocion[] {
  return DEMO_PROMOCIONES.map((p) => ({
    idPromocion: p.id,
    etiqueta: p.etiqueta,
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    imagenUrl: p.banner,
    idCafeteria: p.idCafeteria,
    categoria: p.categoria,
  }));
}

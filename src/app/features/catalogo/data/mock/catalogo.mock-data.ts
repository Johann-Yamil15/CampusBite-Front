// CL-Sprint5 11/11/2026: menú de demostración (antes alumno/presentation/catalogo.mock.ts de JY-Sprint4),
// armado desde la BD de demostración compartida (core/mock/demo-db.ts) con la forma de sp_menu_cafeteria.
import { DEMO_CAFETERIAS, DEMO_PRODUCTOS, DEMO_PROMOCIONES, fotoDemo } from '@core/mock/demo-db';
import { DemoNegocioStore, DemoPromocionNegocio } from '@core/mock/demo-negocio.store';
import { MenuCafeteria, Promocion } from '@features/catalogo/domain/models/catalogo.model';

/**
 * CL-Sprint5 11/11/2026 (etapa 9): "abierta" y "cierraA" ya no son fijos: salen del horario y del "cerrar
 * por hoy" que el encargado edita en /mi-negocio/horario (DemoNegocioStore).
 */
export function menuDemo(store: DemoNegocioStore, ahora = new Date()): MenuCafeteria[] {
  return DEMO_CAFETERIAS.map((c) => menuDe(c, store.estadoHoy(c.id, ahora)));
}

function menuDe(
  c: (typeof DEMO_CAFETERIAS)[number],
  hoy: { abierta: boolean; cierraA: string | null },
): MenuCafeteria {
  return {
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
      dietas: [...p.dietas],
    })),
    logoUrl: c.logo,
    portadaUrl: c.portada,
    calificacion: c.calificacion,
    resenas: c.resenas,
    abierta: hoy.abierta,
    cierraA: hoy.cierraA,
    minutosEstimados: c.minutosEstimados,
  };
}

/**
 * Las del carrusel: las de la plataforma (fijas) y, CL-Sprint5 11/11/2026 (etapa 9), las que el encargado
 * tiene activas y vigentes hoy en /mi-negocio/promociones.
 */
export function promocionesDemo(store: DemoNegocioStore, ahora = new Date()): Promocion[] {
  return [...store.promocionesVigentes(ahora).map(promocionNegocio), ...promocionesPlataforma()];
}

/** Insignia corta según el tipo: "-20%", "A $45", "Combo $79". */
export function etiquetaPromocion(p: Pick<DemoPromocionNegocio, 'tipo' | 'valor'>): string {
  if (p.tipo === 'porcentaje') return `-${p.valor}%`;
  return p.tipo === 'combo' ? `Combo $${p.valor}` : `A $${p.valor}`;
}

function promocionNegocio(p: DemoPromocionNegocio): Promocion {
  const c = DEMO_CAFETERIAS.find((x) => x.id === p.idCafeteria);
  return {
    idPromocion: p.id,
    etiqueta: etiquetaPromocion(p),
    titulo: p.nombre,
    subtitulo: c ? `${p.descripcion} · ${c.nombre}` : p.descripcion,
    imagenUrl: c?.portada ?? null,
    idCafeteria: p.idCafeteria,
    categoria: null,
  };
}

function promocionesPlataforma(): Promocion[] {
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

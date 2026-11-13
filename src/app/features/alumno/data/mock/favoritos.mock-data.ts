// CL-Sprint5 11/11/2026: favoritos de demostración (antes FAVORITAS en alumno/presentation/catalogo.mock.ts
// de JY-Sprint4). Se arman desde la BD de demostración compartida (core/mock/demo-db.ts).
// CL-Sprint5 11/11/2026 (etapa 7): también platillos, guardados como "fila" (lo que guardaría la tabla:
// el id y los datos del momento) para poder mostrar los que la cafetería ya retiró.
import {
  DEMO_CAFETERIA,
  DEMO_CAFETERIAS,
  DEMO_PRODUCTO,
  DEMO_PRODUCTOS,
  fotoDemo,
} from '@core/mock/demo-db';
import {
  CafeteriaFavorita,
  PlatilloFavorito,
} from '@features/alumno/domain/models/favorito.model';

/** Las que el alumno demo tiene guardadas al empezar. */
export const IDS_FAVORITAS_DEMO: string[] = [
  DEMO_CAFETERIA.central,
  DEMO_CAFETERIA.rincon,
  DEMO_CAFETERIA.express,
];

/** Lo que se guarda de un platillo favorito (las columnas de la tabla propuesta). */
export interface FilaPlatilloFavorito {
  idProducto: string;
  producto: string;
  precio: number;
  imagenUrl: string | null;
  idCafeteria: string;
  cafeteria: string;
}

/** CL-Sprint5 11/11/2026 (etapa 9): `abierta` dice si abre ahora (horario del negocio, DemoNegocioStore). */
export type AbiertaAhora = (idCafeteria: string) => boolean;

/** La favorita tal como la devolvería el back, o `null` si la cafetería no existe. */
export function favoritaDemo(idCafeteria: string, abierta: AbiertaAhora): CafeteriaFavorita | null {
  const c = DEMO_CAFETERIAS.find((x) => x.id === idCafeteria);
  if (!c) return null;
  return {
    idCafeteria: c.id,
    nombre: c.nombre,
    foto: c.portada,
    calificacion: c.calificacion,
    puntoEntrega: c.puntoEntrega,
    esDelCampus: c.esDelCampus,
    abierta: abierta(c.id),
    platillos: DEMO_PRODUCTOS.filter((p) => p.idCafeteria === c.id).length,
  };
}

/** La fila de un producto que está hoy en el menú, o `null` si no existe. */
export function filaPlatilloDemo(idProducto: string): FilaPlatilloFavorito | null {
  const p = DEMO_PRODUCTOS.find((x) => x.id === idProducto);
  const c = p && DEMO_CAFETERIAS.find((x) => x.id === p.idCafeteria);
  if (!p || !c) return null;
  return {
    idProducto: p.id,
    producto: p.nombre,
    precio: p.precio,
    imagenUrl: fotoDemo(p.foto),
    idCafeteria: c.id,
    cafeteria: c.nombre,
  };
}

/** El favorito como lo devolvería el back: con el precio de hoy y si se puede pedir. */
export function platilloFavoritoDemo(fila: FilaPlatilloFavorito, abierta: AbiertaAhora): PlatilloFavorito {
  const hoy = filaPlatilloDemo(fila.idProducto);
  const c = DEMO_CAFETERIAS.find((x) => x.id === fila.idCafeteria);
  return {
    ...(hoy ?? fila),
    disponible: !!hoy,
    cafeteriaAbierta: !!c && abierta(c.id),
  };
}

/** La malteada que Sabor de Casa ya retiró de su menú (también sale en el pedido CB-2411-0038). */
const MALTEADA_RETIRADA: FilaPlatilloFavorito = {
  idProducto: '00000000-0000-4000-8000-0000000000f1',
  producto: 'Malteada de Vainilla',
  precio: 45,
  imagenUrl: null,
  idCafeteria: DEMO_CAFETERIA.sabor,
  cafeteria: DEMO_CAFETERIAS.find((c) => c.id === DEMO_CAFETERIA.sabor)!.nombre,
};

/** Los platillos que el alumno demo tiene guardados al empezar: uno de cada caso. */
export function platillosFavoritosDemo(): FilaPlatilloFavorito[] {
  return [
    filaPlatilloDemo(DEMO_PRODUCTO.sandwich)!, // disponible
    filaPlatilloDemo(DEMO_PRODUCTO.bowlPollo)!, // disponible
    filaPlatilloDemo(DEMO_PRODUCTO.latte)!, // su cafetería (Café Express) está cerrada
    MALTEADA_RETIRADA, // ya no está en el menú
  ];
}

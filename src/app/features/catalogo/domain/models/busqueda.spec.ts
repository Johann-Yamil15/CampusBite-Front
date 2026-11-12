import {
  CRITERIOS_VACIOS,
  CriteriosBusqueda,
  PlatilloCatalogo,
  buscarPlatillos,
  filtrosActivos,
  normalizar,
} from './catalogo.model';

const base: Omit<PlatilloCatalogo, 'idProducto' | 'producto'> = {
  categoria: 'Comidas',
  descripcion: null,
  precio: 50,
  imagenUrl: null,
  calificacion: 4.5,
  minutosPreparacion: 10,
  precioAnterior: null,
  popular: false,
  dietas: [],
  idCafeteria: 'c1',
  cafeteria: 'Cafetería Central',
  cafeteriaAbierta: true,
};

const LISTA: PlatilloCatalogo[] = [
  { ...base, idProducto: 'cafe', producto: 'Café Americano', categoria: 'Bebidas', precio: 28, calificacion: 4.6, minutosPreparacion: 3, dietas: ['vegetariano', 'sin_gluten'], idCafeteria: 'c2', cafeteria: 'Café Express', cafeteriaAbierta: false },
  { ...base, idProducto: 'sand', producto: 'Sándwich de Pollo', descripcion: 'Pan artesanal con pollo', precio: 55, calificacion: 4.8, minutosPreparacion: 8 },
  { ...base, idProducto: 'pan', producto: 'Panini Caprese', descripcion: 'Mozzarella y pesto', precio: 49, calificacion: 4.7, dietas: ['vegetariano'] },
  { ...base, idProducto: 'bowl', producto: 'Bowl de Pollo', categoria: 'Saludable', precio: 72, calificacion: 4.9, minutosPreparacion: 12, dietas: ['sin_gluten'] },
];

const buscar = (c: Partial<CriteriosBusqueda>) =>
  buscarPlatillos(LISTA, { ...CRITERIOS_VACIOS, ...c }).map((p) => p.idProducto);

/** CL-Sprint5 11/11/2026: reglas del buscador (etapa 4). */
describe('buscarPlatillos', () => {
  it('sin criterios: abiertas primero, mejor calificadas primero; la cafetería cerrada al final', () => {
    expect(buscar({})).toEqual(['bowl', 'sand', 'pan', 'cafe']);
  });

  it('el texto no distingue acentos ni mayúsculas y busca en nombre, ingredientes y cafetería', () => {
    expect(buscar({ texto: 'SANDWICH' })).toEqual(['sand']);
    expect(buscar({ texto: 'pesto' })).toEqual(['pan']);
    expect(buscar({ texto: 'express' })).toEqual(['cafe']);
  });

  it('relevancia: primero los que tienen el texto en el nombre', () => {
    // "pollo" está en el nombre de los dos, el Bowl gana por calificación
    expect(buscar({ texto: 'pollo' })).toEqual(['bowl', 'sand']);
    // "pan" está en el nombre de Panini y solo en la descripción del Sándwich
    expect(buscar({ texto: 'pan' })).toEqual(['pan', 'sand']);
  });

  it('filtra por precio, tiempo, calificación, categoría y cafetería', () => {
    expect(buscar({ precioMax: 50 })).toEqual(['pan', 'cafe']);
    expect(buscar({ minutosMax: 8 })).toEqual(['sand', 'cafe']);
    expect(buscar({ calificacionMin: 4.8 })).toEqual(['bowl', 'sand']);
    expect(buscar({ categoria: 'Bebidas' })).toEqual(['cafe']);
    expect(buscar({ idCafeteria: 'c2' })).toEqual(['cafe']);
  });

  it('las dietas se suman: deben cumplirse todas', () => {
    expect(buscar({ dietas: ['vegetariano'] })).toEqual(['pan', 'cafe']);
    expect(buscar({ dietas: ['vegetariano', 'sin_gluten'] })).toEqual(['cafe']);
  });

  it('solo abiertas quita las de cafeterías cerradas', () => {
    expect(buscar({ soloAbiertas: true })).not.toContain('cafe');
  });

  it('ordena por precio y por tiempo', () => {
    expect(buscar({ orden: 'precio_asc' })).toEqual(['pan', 'sand', 'bowl', 'cafe']);
    expect(buscar({ orden: 'precio_desc' })).toEqual(['bowl', 'sand', 'pan', 'cafe']);
    expect(buscar({ orden: 'tiempo' })).toEqual(['sand', 'pan', 'bowl', 'cafe']);
  });

  it('cuenta los filtros activos (sin texto ni orden)', () => {
    expect(filtrosActivos(CRITERIOS_VACIOS)).toBe(0);
    expect(
      filtrosActivos({ ...CRITERIOS_VACIOS, texto: 'x', orden: 'tiempo', precioMax: 40, dietas: ['vegetariano', 'sin_gluten'] }),
    ).toBe(3);
  });

  it('normalizar quita acentos', () => {
    expect(normalizar('  Ñandú Café ')).toBe('nandu cafe');
  });
});

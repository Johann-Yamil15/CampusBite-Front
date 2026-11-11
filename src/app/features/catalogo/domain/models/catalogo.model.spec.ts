import {
  MenuCafeteria,
  cafeteriasDestacadas,
  categorias,
  platillos,
  populares,
} from './catalogo.model';

const MENU: MenuCafeteria[] = [
  {
    idCafeteria: 'c1',
    cafeteria: 'Central',
    esDelCampus: true,
    puntoEntrega: 'Barra',
    logoUrl: null,
    portadaUrl: null,
    calificacion: null,
    resenas: null,
    abierta: true,
    cierraA: null,
    minutosEstimados: null,
    metodosPago: ['efectivo'],
    productos: [
      { idProducto: 'p1', producto: 'Latte', categoria: 'Bebidas', descripcion: null, precio: 38, imagenUrl: null, calificacion: null, minutosPreparacion: null, precioAnterior: null, popular: false },
      { idProducto: 'p2', producto: 'Galleta', categoria: null, descripcion: null, precio: 20, imagenUrl: null, calificacion: null, minutosPreparacion: null, precioAnterior: null, popular: false },
    ],
  },
  {
    idCafeteria: 'c2',
    cafeteria: 'Terraza',
    esDelCampus: false,
    puntoEntrega: 'Kiosco',
    logoUrl: null,
    portadaUrl: null,
    calificacion: null,
    resenas: null,
    abierta: true,
    cierraA: null,
    minutosEstimados: null,
    metodosPago: ['tarjeta'],
    productos: [
      { idProducto: 'p3', producto: 'Chilaquiles', categoria: 'Desayunos', descripcion: null, precio: 58, imagenUrl: null, calificacion: null, minutosPreparacion: null, precioAnterior: null, popular: false },
      { idProducto: 'p4', producto: 'Té', categoria: 'Bebidas', descripcion: null, precio: 25, imagenUrl: null, calificacion: null, minutosPreparacion: null, precioAnterior: null, popular: false },
    ],
  },
];

describe('catalogo.model', () => {
  it('platillos aplana el menú y cada producto lleva su cafetería', () => {
    const lista = platillos(MENU);
    expect(lista.map((p) => p.idProducto)).toEqual(['p1', 'p2', 'p3', 'p4']);
    expect(lista[2]).toMatchObject({ idCafeteria: 'c2', cafeteria: 'Terraza' });
  });

  it('categorias da las distintas, ordenadas y sin las nulas', () => {
    expect(categorias(MENU)).toEqual(['Bebidas', 'Desayunos']);
  });

  it('populares: solo los marcados de cafeterías abiertas, mejor calificados primero', () => {
    const menu: MenuCafeteria[] = [
      {
        ...MENU[0],
        productos: [
          { ...MENU[0].productos[0], popular: true, calificacion: 4.2 },
          { ...MENU[0].productos[1], popular: true, calificacion: 4.9 },
        ],
      },
      { ...MENU[1], abierta: false, productos: [{ ...MENU[1].productos[0], popular: true, calificacion: 5 }] },
    ];
    expect(populares(menu).map((p) => p.idProducto)).toEqual(['p2', 'p1']);
  });

  it('cafeteriasDestacadas: abiertas primero y luego por calificación', () => {
    const menu: MenuCafeteria[] = [
      { ...MENU[0], idCafeteria: 'a', abierta: false, calificacion: 5 },
      { ...MENU[0], idCafeteria: 'b', abierta: true, calificacion: 4.1 },
      { ...MENU[0], idCafeteria: 'c', abierta: true, calificacion: 4.8 },
    ];
    expect(cafeteriasDestacadas(menu).map((c) => c.idCafeteria)).toEqual(['c', 'b', 'a']);
  });
});

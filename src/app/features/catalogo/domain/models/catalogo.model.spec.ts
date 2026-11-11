import { MenuCafeteria, categorias, platillos } from './catalogo.model';

const MENU: MenuCafeteria[] = [
  {
    idCafeteria: 'c1',
    cafeteria: 'Central',
    esDelCampus: true,
    puntoEntrega: 'Barra',
    metodosPago: ['efectivo'],
    productos: [
      { idProducto: 'p1', producto: 'Latte', categoria: 'Bebidas', descripcion: null, precio: 38, imagenUrl: null },
      { idProducto: 'p2', producto: 'Galleta', categoria: null, descripcion: null, precio: 20, imagenUrl: null },
    ],
  },
  {
    idCafeteria: 'c2',
    cafeteria: 'Terraza',
    esDelCampus: false,
    puntoEntrega: 'Kiosco',
    metodosPago: ['tarjeta'],
    productos: [
      { idProducto: 'p3', producto: 'Chilaquiles', categoria: 'Desayunos', descripcion: null, precio: 58, imagenUrl: null },
      { idProducto: 'p4', producto: 'Té', categoria: 'Bebidas', descripcion: null, precio: 25, imagenUrl: null },
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
});

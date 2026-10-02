import { ProductMapper } from './product.mapper';

describe('ProductMapper', () => {
  it('convierte el DTO del API a la entidad de dominio', () => {
    const product = ProductMapper.toDomain({
      id: '1',
      nombre: 'Torta',
      descripcion: 'De jamón',
      precio: 45,
      imagenUrl: null,
      disponible: true,
    });

    expect(product).toEqual({
      id: '1',
      name: 'Torta',
      description: 'De jamón',
      price: 45,
      imageUrl: null,
      available: true,
    });
  });
});

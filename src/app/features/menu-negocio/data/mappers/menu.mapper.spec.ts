import { ProductoDto } from '@features/menu-negocio/data/dtos/menu.dto';
import { ProductData, validateProductImage } from '@features/menu-negocio/domain/models/menu.model';
import { MenuMapper } from './menu.mapper';

const DTO: ProductoDto = {
  idProducto: 'p-1',
  idCafeteria: 'c-1',
  idCategoria: 'k-1',
  categoria: 'Desayunos',
  nombre: 'Chilaquiles verdes',
  descripcion: 'Con pollo y crema',
  precio: 55,
  imagenUrl: null,
  disponible: true,
  creadoEn: '2026-10-01T12:00:00Z',
  actualizadoEn: '2026-10-22T10:15:00Z',
};

const DATA: ProductData = {
  name: 'Café americano',
  description: null,
  price: 25.5,
  categoryId: null,
  available: false,
};

/** CL-Sprint4 28/10/2026: HU-07B. Contrato real de TEC-09/TEC-10. */
describe('MenuMapper', () => {
  it('convierte el ProductoDto del backend en un producto de dominio', () => {
    expect(MenuMapper.toDomain(DTO)).toEqual({
      id: 'p-1',
      cafeteriaId: 'c-1',
      categoryId: 'k-1',
      categoryName: 'Desayunos',
      name: 'Chilaquiles verdes',
      description: 'Con pollo y crema',
      price: 55,
      imageUrl: null,
      available: true,
      createdAt: new Date('2026-10-01T12:00:00Z'),
      updatedAt: new Date('2026-10-22T10:15:00Z'),
    });
  });

  it('convierte una categoría', () => {
    expect(MenuMapper.toCategory({ idCategoria: 'k-1', nombre: 'Bebidas' })).toEqual({
      id: 'k-1',
      name: 'Bebidas',
    });
  });

  it('arma el body del PUT siempre con disponible', () => {
    expect(MenuMapper.toRequest(DATA)).toEqual({
      nombre: 'Café americano',
      descripcion: null,
      precio: 25.5,
      idCategoria: null,
      disponible: false,
    });
  });

  it('arma el multipart del alta con precio con punto y sin los opcionales vacíos', () => {
    const form = MenuMapper.toCreateFormData(DATA, null);
    expect(form.get('nombre')).toBe('Café americano');
    expect(form.get('precio')).toBe('25.50');
    expect(form.get('disponible')).toBe('false');
    expect(form.has('descripcion')).toBe(false);
    expect(form.has('idCategoria')).toBe(false);
    expect(form.has('archivo')).toBe(false);
  });

  it('agrega categoría, descripción y la imagen en el campo "archivo"', () => {
    const image = new File(['x'], 'foto.png', { type: 'image/png' });
    const form = MenuMapper.toCreateFormData(
      { ...DATA, description: '12 oz', categoryId: 'k-2' },
      image,
    );
    expect(form.get('descripcion')).toBe('12 oz');
    expect(form.get('idCategoria')).toBe('k-2');
    expect((form.get('archivo') as File).name).toBe('foto.png');
  });
});

describe('validateProductImage', () => {
  it('acepta JPEG, PNG y WebP de hasta 5 MB', () => {
    expect(validateProductImage({ type: 'image/webp', size: 5 * 1024 * 1024 })).toBeNull();
    expect(validateProductImage({ type: 'image/jpeg', size: 10 })).toBeNull();
  });

  it('rechaza otros tipos, archivos vacíos y más de 5 MB', () => {
    expect(validateProductImage({ type: 'image/gif', size: 10 })).toContain('JPEG, PNG o WebP');
    expect(validateProductImage({ type: 'image/png', size: 0 })).toContain('vacío');
    expect(validateProductImage({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toContain(
      '5 MB',
    );
  });
});

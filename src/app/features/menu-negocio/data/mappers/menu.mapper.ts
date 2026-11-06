import {
  Category,
  MenuProduct,
  ProductData,
} from '@features/menu-negocio/domain/models/menu.model';
import {
  CategoriaDto,
  GuardarProductoRequestDto,
  ProductoDto,
} from '@features/menu-negocio/data/dtos/menu.dto';

export const MenuMapper = {
  toDomain(dto: ProductoDto): MenuProduct {
    return {
      id: dto.idProducto,
      cafeteriaId: dto.idCafeteria,
      categoryId: dto.idCategoria,
      categoryName: dto.categoria,
      name: dto.nombre,
      description: dto.descripcion,
      price: dto.precio,
      imageUrl: dto.imagenUrl,
      available: dto.disponible,
      createdAt: new Date(dto.creadoEn),
      updatedAt: new Date(dto.actualizadoEn),
    };
  },

  toCategory(dto: CategoriaDto): Category {
    return { id: dto.idCategoria, name: dto.nombre };
  },

  toRequest(data: ProductData): GuardarProductoRequestDto {
    return {
      nombre: data.name,
      descripcion: data.description,
      precio: data.price,
      idCategoria: data.categoryId,
      disponible: data.available,
    };
  },

  /**
   * Formulario multipart del alta. El precio va siempre con punto ("55.50"): el backend lee el formulario
   * en cultura invariante. Los opcionales vacíos no se mandan.
   */
  toCreateFormData(data: ProductData, image: File | null): FormData {
    const form = new FormData();
    form.append('nombre', data.name);
    if (data.description) form.append('descripcion', data.description);
    form.append('precio', data.price.toFixed(2));
    if (data.categoryId) form.append('idCategoria', data.categoryId);
    form.append('disponible', String(data.available));
    if (image) form.append('archivo', image, image.name);
    return form;
  },
};

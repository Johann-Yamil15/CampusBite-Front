import { PagedResult, Product } from '@domain/models/product.model';
import { PagedResponseDto, ProductDto } from '@data/dtos/product.dto';

export const ProductMapper = {
  toDomain(dto: ProductDto): Product {
    return {
      id: dto.id,
      name: dto.nombre,
      description: dto.descripcion,
      price: dto.precio,
      imageUrl: dto.imagenUrl,
      available: dto.disponible,
    };
  },

  toPaged(dto: PagedResponseDto<ProductDto>): PagedResult<Product> {
    return {
      items: dto.items.map(ProductMapper.toDomain),
      total: dto.total,
      page: dto.pagina,
      pageSize: dto.tamanoPagina,
    };
  },
};

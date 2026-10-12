export interface ProductDto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagenUrl: string | null;
  disponible: boolean;
}

export interface PagedResponseDto<T> {
  items: T[];
  total: number;
  pagina: number;
  tamanoPagina: number;
}

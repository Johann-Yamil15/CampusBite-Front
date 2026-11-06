// FB-Sprint4 29/10/2026: Interfaces del dominio para el menú de alumno, carrito y creación de órdenes.

export interface ProductoMenu {
  idProducto:  string;
  producto:    string;     // "producto" (así viene del SP, no "nombre")
  categoria:   string | null;
  descripcion: string | null;
  precio:      number;
  imagenUrl:   string | null;
}

export interface MenuCafeteria {
  idCafeteria:  string;
  cafeteria:    string;
  esDelCampus:  boolean;
  puntoEntrega: string;
  metodosPago:  ('efectivo' | 'tarjeta' | 'transferencia')[];
  productos:    ProductoMenu[];
}

// Modelo del carrito (no viene del backend, es local)
export interface ItemCarrito {
  idProducto:  string;
  producto:    string;
  precio:      number;
  cantidad:    number;
  imagenUrl:   string | null;
  idCafeteria: string;        // para validar que no se mezclen cafeterías
  cafeteria:   string;
}

// Para crear la orden (sp_crear_orden espera estos campos)
export interface CrearOrdenRequest {
  idCafeteria: string;
  recogidaEn:  string;   // ISO timestamp
  metodo:      'efectivo' | 'tarjeta' | 'transferencia';
  items:       { idProducto: string; cantidad: number }[];
  notas?:      string;
}
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductoDto } from '@features/menu-negocio/data/dtos/menu.dto';
import { ProductData } from '@features/menu-negocio/domain/models/menu.model';
import { MenuHttpRepository } from './menu-http.repository';

const CAF = '00000000-0000-0000-0000-0000000000c1';
const PROD = '00000000-0000-0000-0000-0000000000e1';
const BASE = `/api/cafeterias/${CAF}`;

const DTO: ProductoDto = {
  idProducto: PROD,
  idCafeteria: CAF,
  idCategoria: null,
  categoria: null,
  nombre: 'Chilaquiles verdes',
  descripcion: null,
  precio: 55,
  imagenUrl: null,
  disponible: true,
  creadoEn: '2026-10-01T12:00:00Z',
  actualizadoEn: '2026-10-01T12:00:00Z',
};

const DATA: ProductData = {
  name: 'Chilaquiles verdes',
  description: null,
  price: 55,
  categoryId: null,
  available: true,
};

/** CL-Sprint4 28/10/2026: HU-07B. Verifica rutas, verbos y cuerpos contra el contrato real de TEC-09/TEC-10. */
describe('MenuHttpRepository', () => {
  let repo: MenuHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), MenuHttpRepository],
    });
    repo = TestBed.inject(MenuHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // JJ-Sprint5 15/11/2026: el back responde paginado ({ items, total, ... }), no un arreglo
  const pagina = (n: number) => `${BASE}/productos?pagina=${n}&tamanoPagina=100`;
  const productos = (desde: number, cuantos: number): ProductoDto[] =>
    Array.from({ length: cuantos }, (_, i) => ({ ...DTO, idProducto: `p${desde + i}`, nombre: `Platillo ${desde + i}` }));

  it('lista los productos de la cafetería (una página)', () => {
    let names: string[] = [];
    repo.listProducts(CAF).subscribe((list) => (names = list.map((p) => p.name)));
    const req = http.expectOne(pagina(1));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [DTO], total: 1, pagina: 1, tamanoPagina: 100 });
    expect(names).toEqual(['Chilaquiles verdes']);
  });

  it('un negocio nuevo sin platillos da una lista vacía, no un error', () => {
    let lista: unknown[] | null = null;
    repo.listProducts(CAF).subscribe((l) => (lista = l));
    http.expectOne(pagina(1)).flush({ items: [], total: 0, pagina: 1, tamanoPagina: 100 });
    expect(lista).toEqual([]);
  });

  it('junta todas las páginas cuando hay más de 100 productos', () => {
    let total = 0;
    repo.listProducts(CAF).subscribe((l) => (total = l.length));
    http.expectOne(pagina(1)).flush({ items: productos(1, 100), total: 150, pagina: 1, tamanoPagina: 100 });
    http.expectOne(pagina(2)).flush({ items: productos(101, 50), total: 150, pagina: 2, tamanoPagina: 100 });
    expect(total).toBe(150);
  });

  it('lista las categorías', () => {
    let names: string[] = [];
    repo.listCategories(CAF).subscribe((list) => (names = list.map((c) => c.name)));
    const req = http.expectOne(`${BASE}/categorias`);
    expect(req.request.method).toBe('GET');
    req.flush([{ idCategoria: 'k-1', nombre: 'Bebidas' }]);
    expect(names).toEqual(['Bebidas']);
  });

  it('crea con multipart/form-data y devuelve el producto del 201', () => {
    let id = '';
    repo.createProduct(CAF, DATA, null).subscribe((p) => (id = p.id));
    const req = http.expectOne(`${BASE}/productos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBeInstanceOf(FormData);
    req.flush(DTO, { status: 201, statusText: 'Created' });
    expect(id).toBe(PROD);
  });

  it('edita con PUT y JSON', () => {
    repo.updateProduct(CAF, PROD, DATA).subscribe();
    const req = http.expectOne(`${BASE}/productos/${PROD}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      nombre: 'Chilaquiles verdes',
      descripcion: null,
      precio: 55,
      idCategoria: null,
      disponible: true,
    });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('cambia la disponibilidad con PATCH y el booleano crudo', () => {
    repo.setAvailable(CAF, PROD, false).subscribe();
    const req = http.expectOne(`${BASE}/productos/${PROD}/disponible`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toBe(false);
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('elimina con DELETE', () => {
    repo.deleteProduct(CAF, PROD).subscribe();
    const req = http.expectOne(`${BASE}/productos/${PROD}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('sube la imagen en el campo "archivo" y devuelve su URL', () => {
    let url = '';
    const image = new File(['x'], 'foto.webp', { type: 'image/webp' });
    repo.uploadImage(CAF, PROD, image).subscribe((u) => (url = u));
    const req = http.expectOne(`${BASE}/productos/${PROD}/imagen`);
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('archivo')).toBeInstanceOf(File);
    req.flush({ imagenUrl: 'https://blob/productos/x.webp' });
    expect(url).toBe('https://blob/productos/x.webp');
  });
});

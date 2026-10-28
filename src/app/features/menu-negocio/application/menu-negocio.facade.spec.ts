import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { MenuRepository } from '@features/menu-negocio/domain/repositories/menu.repository';
import {
  Category,
  MenuProduct,
  ProductData,
} from '@features/menu-negocio/domain/models/menu.model';
import { IMAGE_SERVICE_UNAVAILABLE, MenuNegocioFacade } from './menu-negocio.facade';

const product = (id: string, name: string, available = true, categoryName: string | null = null) =>
  ({
    id,
    cafeteriaId: 'c-1',
    categoryId: categoryName ? `k-${categoryName}` : null,
    categoryName,
    name,
    description: null,
    price: 10,
    imageUrl: null,
    available,
    createdAt: new Date('2026-10-01T12:00:00Z'),
    updatedAt: new Date('2026-10-01T12:00:00Z'),
  }) satisfies MenuProduct;

const CATEGORIES: Category[] = [
  { id: 'k-Bebidas', name: 'Bebidas' },
  { id: 'k-Desayunos', name: 'Desayunos' },
];

const DATA: ProductData = {
  name: 'Café',
  description: null,
  price: 25,
  categoryId: 'k-Bebidas',
  available: true,
};

/** Repositorio en memoria: cada prueba fija lo que responde. */
class FakeMenuRepository extends MenuRepository {
  products: Observable<MenuProduct[]> = of([
    product('p-1', 'Chilaquiles', true, 'Desayunos'),
    product('p-2', 'Agua', false),
  ]);
  created: Observable<MenuProduct> = of(product('p-3', 'Café', true, 'Bebidas'));
  voidResult: Observable<void> = of(undefined);
  url: Observable<string> = of('https://blob/x.webp');

  listProducts = vi.fn(() => this.products);
  listCategories = vi.fn(() => of(CATEGORIES));
  createProduct = vi.fn(() => this.created);
  updateProduct = vi.fn(() => this.voidResult);
  setAvailable = vi.fn(() => this.voidResult);
  deleteProduct = vi.fn(() => this.voidResult);
  uploadImage = vi.fn(() => this.url);
}

const apiError = (status: number, message = 'detalle'): ApiError => ({ status, message });

/** CL-Sprint4 28/10/2026: HU-07B. */
describe('MenuNegocioFacade', () => {
  let facade: MenuNegocioFacade;
  let repo: FakeMenuRepository;

  beforeEach(() => {
    repo = new FakeMenuRepository();
    TestBed.configureTestingModule({
      providers: [MenuNegocioFacade, { provide: MenuRepository, useValue: repo }],
    });
    facade = TestBed.inject(MenuNegocioFacade);
    facade.load('c-1').subscribe();
  });

  it('carga productos y categorías y calcula las estadísticas', () => {
    expect(repo.listProducts).toHaveBeenCalledWith('c-1');
    expect(facade.categories()).toEqual(CATEGORIES);
    expect(facade.total()).toBe(2);
    expect(facade.availableCount()).toBe(1);
    expect(facade.unavailableCount()).toBe(1);
    expect(facade.loading()).toBe(false);
  });

  it('guarda el error de la carga', () => {
    repo.products = throwError(() => apiError(403, 'Sin permiso para listar productos'));
    facade.load('c-1').subscribe({ error: () => undefined });
    expect(facade.error()).toBe('Sin permiso para listar productos');
  });

  it('agrega el producto creado en el orden del backend (categoría y nombre)', () => {
    facade.create(DATA, null).subscribe();
    expect(repo.createProduct).toHaveBeenCalledWith('c-1', DATA, null);
    expect(facade.products().map((p) => p.name)).toEqual(['Café', 'Chilaquiles', 'Agua']);
    expect(facade.total()).toBe(3);
  });

  it('no llama al backend si la imagen no es válida', () => {
    let error: ApiError | undefined;
    const gif = new File(['x'], 'a.gif', { type: 'image/gif' });
    facade.create(DATA, gif).subscribe({ error: (e: ApiError) => (error = e) });
    expect(repo.createProduct).not.toHaveBeenCalled();
    expect(error?.message).toContain('JPEG, PNG o WebP');
  });

  it('traduce el 503 a un mensaje claro del servicio de imágenes', () => {
    repo.created = throwError(() => apiError(503));
    let message = '';
    const png = new File(['x'], 'a.png', { type: 'image/png' });
    facade.create(DATA, png).subscribe({ error: (e: ApiError) => (message = e.message) });
    expect(message).toBe(IMAGE_SERVICE_UNAVAILABLE);
    expect(facade.total()).toBe(2);
  });

  it('muestra el primer error de validación del backend', () => {
    repo.created = throwError(
      () =>
        ({
          status: 400,
          message: 'One or more validation errors occurred.',
          errors: { Precio: ['El precio debe ser mayor a 0.'] },
        }) satisfies ApiError,
    );
    let message = '';
    facade.create(DATA, null).subscribe({ error: (e: ApiError) => (message = e.message) });
    expect(message).toBe('El precio debe ser mayor a 0.');
  });

  it('al editar arma el producto con los datos enviados y el nombre de su categoría', () => {
    facade.update('p-2', { ...DATA, name: 'Agua de jamaica' }).subscribe();
    const edited = facade.products().find((p) => p.id === 'p-2');
    expect(edited).toMatchObject({ name: 'Agua de jamaica', categoryName: 'Bebidas', price: 25 });
    expect(repo.updateProduct).toHaveBeenCalledWith('c-1', 'p-2', {
      ...DATA,
      name: 'Agua de jamaica',
    });
  });

  it('el toggle cambia al momento y se revierte si el backend falla', () => {
    const response = new Subject<void>();
    repo.voidResult = response;
    facade.setAvailable('p-1', false).subscribe({ error: () => undefined });
    expect(facade.products()[0].available).toBe(false);
    expect(facade.isPending('p-1')).toBe(true);
    expect(facade.availableCount()).toBe(0);

    response.error(apiError(404, 'El producto no existe'));
    expect(facade.products()[0].available).toBe(true);
    expect(facade.isPending('p-1')).toBe(false);
  });

  it('elimina el producto de la lista', () => {
    facade.remove('p-2').subscribe();
    expect(facade.products().map((p) => p.id)).toEqual(['p-1']);
  });

  it('con 409 al eliminar deja el producto y pasa el mensaje del backend', () => {
    repo.voidResult = throwError(() =>
      apiError(409, 'El producto tiene 1 orden(es) activa(s); desactívalo en su lugar'),
    );
    let message = '';
    facade.remove('p-1').subscribe({ error: (e: ApiError) => (message = e.message) });
    expect(message).toContain('orden(es) activa(s)');
    expect(facade.total()).toBe(2);
  });

  it('al cambiar la imagen actualiza su URL', () => {
    const webp = new File(['x'], 'a.webp', { type: 'image/webp' });
    facade.uploadImage('p-1', webp).subscribe();
    expect(facade.products()[0].imageUrl).toBe('https://blob/x.webp');
  });
});

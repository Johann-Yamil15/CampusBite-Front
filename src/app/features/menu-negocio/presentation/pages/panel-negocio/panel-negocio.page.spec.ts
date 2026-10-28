import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Cafeteria, CafeteriaFacade } from '@features/cafeterias';
import { MenuRepository } from '@features/menu-negocio/domain/repositories/menu.repository';
import { MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { PanelNegocioPage } from './panel-negocio.page';

const CAF_ID = '00000000-0000-0000-0000-0000000000c1';

const CAFETERIA: Cafeteria = {
  id: CAF_ID,
  name: 'Cafetería Central (prueba)',
  location: 'Edificio principal',
  onCampus: true,
  pickupPoint: 'Puerta 1',
  active: true,
  paymentMethods: ['Tarjeta', 'Efectivo'],
  createdAt: new Date('2026-10-04T12:00:00Z'),
  updatedAt: new Date('2026-10-04T12:00:00Z'),
};

const product = (id: string, name: string, available: boolean, categoryName: string | null) =>
  ({
    id,
    cafeteriaId: CAF_ID,
    categoryId: categoryName ? `k-${categoryName}` : null,
    categoryName,
    name,
    description: null,
    price: 25,
    imageUrl: null,
    available,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) satisfies MenuProduct;

/** CafeteriaFacade mínima: el panel solo usa loadById y selected. */
function fakeCafeterias() {
  let selected: Cafeteria | null = null;
  return {
    selected: () => selected,
    loadById: vi.fn(() => {
      selected = CAFETERIA;
      return of(CAFETERIA);
    }),
  };
}

/** CL-Sprint4 28/10/2026: HU-07B. Panel con la facade real y un repositorio en memoria. */
describe('PanelNegocioPage', () => {
  let fixture: ComponentFixture<PanelNegocioPage>;
  let el: HTMLElement;
  let repo: Record<keyof MenuRepository, ReturnType<typeof vi.fn>>;

  const button = (text: string, root: ParentNode = el) =>
    Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!;
  const cardNames = () =>
    Array.from(el.querySelectorAll('app-producto-card h3')).map((h) => h.textContent?.trim());
  const stat = (label: string) =>
    Array.from(el.querySelectorAll('.stat'))
      .find((s) => s.textContent?.includes(label))
      ?.querySelector('dd')?.textContent;

  beforeEach(async () => {
    repo = {
      listProducts: vi.fn(() =>
        of([
          product('p-1', 'Café americano', true, 'Bebidas'),
          product('p-2', 'Chilaquiles verdes', true, 'Desayunos'),
          product('p-3', 'Agua', false, null),
        ]),
      ),
      listCategories: vi.fn(() =>
        of([
          { id: 'k-Bebidas', name: 'Bebidas' },
          { id: 'k-Desayunos', name: 'Desayunos' },
        ]),
      ),
      createProduct: vi.fn(),
      updateProduct: vi.fn(),
      setAvailable: vi.fn(() => of(undefined)),
      deleteProduct: vi.fn(),
      uploadImage: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PanelNegocioPage],
      providers: [
        MenuNegocioFacade,
        { provide: MenuRepository, useValue: repo },
        { provide: CafeteriaFacade, useValue: fakeCafeterias() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PanelNegocioPage);
    fixture.componentRef.setInput('id', CAF_ID);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('muestra las 3 columnas: negocio, galería con todos los productos y estadísticas', () => {
    expect(el.querySelector('.panel-sidebar')!.textContent).toContain('Cafetería Central (prueba)');
    expect(el.querySelector('.panel-sidebar')!.textContent).toContain('Puerta 1');
    expect(cardNames()).toEqual(['Café americano', 'Chilaquiles verdes', 'Agua']);
    expect(stat('Total')).toBe('3');
    expect(stat('No disponibles')).toBe('1');
    expect(stat('Disponibles')).toBe('2');
    expect(repo.listProducts).toHaveBeenCalledWith(CAF_ID);
  });

  it('filtra por categoría y por "Sin categoría"', async () => {
    button('Desayunos', el.querySelector('.chips')!).click();
    await fixture.whenStable();
    expect(cardNames()).toEqual(['Chilaquiles verdes']);

    button('Sin categoría', el.querySelector('.chips')!).click();
    await fixture.whenStable();
    expect(cardNames()).toEqual(['Agua']);

    button('Todos', el.querySelector('.chips')!).click();
    await fixture.whenStable();
    expect(cardNames()).toHaveLength(3);
  });

  it('el toggle hace PATCH y actualiza las estadísticas sin recargar', async () => {
    el.querySelector<HTMLInputElement>('input[role="switch"]')!.click();
    await fixture.whenStable();
    expect(repo.setAvailable).toHaveBeenCalledWith(CAF_ID, 'p-1', false);
    expect(repo.listProducts).toHaveBeenCalledTimes(1);
    expect(stat('No disponibles')).toBe('2');
  });

  it('si el toggle falla regresa el valor y avisa', async () => {
    repo.setAvailable.mockReturnValue(
      throwError(() => ({ status: 404, message: 'El producto no existe' })),
    );
    el.querySelector<HTMLInputElement>('input[role="switch"]')!.click();
    await fixture.whenStable();
    expect(stat('No disponibles')).toBe('1');
    expect(el.querySelector('[role="status"]')!.textContent).toContain('El producto no existe');
  });
});

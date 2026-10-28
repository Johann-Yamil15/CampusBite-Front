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

  beforeAll(() => {
    // jsdom no implementa <dialog>.showModal()/close()
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  });

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

  const openMenuAction = async (cardIndex: number, action: string) => {
    const card = el.querySelectorAll('app-producto-card')[cardIndex];
    button('Opciones', card).click();
    await fixture.whenStable();
    button(action, card).click();
    await fixture.whenStable();
  };

  it('Editar abre el diálogo con los datos del producto', async () => {
    await openMenuAction(1, 'Editar');
    const dialog = el.querySelector('app-producto-form dialog') as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector<HTMLInputElement>('#product-name')!.value).toBe(
      'Chilaquiles verdes',
    );
  });

  it('Eliminar pide confirmación y quita el producto', async () => {
    repo.deleteProduct.mockReturnValue(of(undefined));
    await openMenuAction(2, 'Eliminar');
    const dialog = el.querySelector('app-confirmar-eliminar dialog')!;
    expect(dialog.textContent).toContain('¿Eliminar «Agua»?');
    button('Eliminar', dialog).click();
    await fixture.whenStable();
    expect(repo.deleteProduct).toHaveBeenCalledWith(CAF_ID, 'p-3');
    expect(cardNames()).toEqual(['Café americano', 'Chilaquiles verdes']);
    expect(stat('Total')).toBe('2');
    expect(el.querySelector('app-confirmar-eliminar')).toBeNull();
  });

  it('con órdenes activas muestra el error del backend y conserva el producto', async () => {
    repo.deleteProduct.mockReturnValue(
      throwError(() => ({
        status: 409,
        message: 'El producto tiene 2 orden(es) activa(s); desactívalo en su lugar',
      })),
    );
    await openMenuAction(0, 'Eliminar');
    const dialog = el.querySelector('app-confirmar-eliminar dialog')!;
    button('Eliminar', dialog).click();
    await fixture.whenStable();
    expect(dialog.querySelector('[role="alert"]')!.textContent).toContain('2 orden(es) activa(s)');
    expect(stat('Total')).toBe('3');
  });

  it('Cambiar imagen sube el archivo elegido y actualiza la tarjeta', async () => {
    repo.uploadImage.mockReturnValue(of('https://blob/productos/p-1.webp'));
    const picker = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    const click = vi.spyOn(picker, 'click').mockImplementation(() => undefined);
    await openMenuAction(0, 'Cambiar imagen');
    expect(click).toHaveBeenCalled();

    const file = new File(['x'], 'cafe.webp', { type: 'image/webp' });
    Object.defineProperty(picker, 'files', { value: [file], configurable: true });
    picker.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(repo.uploadImage).toHaveBeenCalledWith(CAF_ID, 'p-1', file);
    expect(el.querySelector('app-producto-card img')!.getAttribute('src')).toBe(
      'https://blob/productos/p-1.webp',
    );
  });

  it('si el servicio de imágenes no responde (503) lo avisa con un mensaje claro', async () => {
    repo.uploadImage.mockReturnValue(throwError(() => ({ status: 503, message: 'x' })));
    const picker = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    vi.spyOn(picker, 'click').mockImplementation(() => undefined);
    await openMenuAction(0, 'Cambiar imagen');
    Object.defineProperty(picker, 'files', {
      value: [new File(['x'], 'a.png', { type: 'image/png' })],
      configurable: true,
    });
    picker.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(el.querySelector('[role="status"]')!.textContent).toContain(
      'El servicio de imágenes no está disponible por ahora',
    );
  });
});

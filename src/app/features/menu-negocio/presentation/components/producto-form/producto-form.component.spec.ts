import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { Category, MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { ProductoFormComponent } from './producto-form.component';

const CATEGORIES: Category[] = [
  { id: 'k-1', name: 'Desayunos' },
  { id: 'k-2', name: 'Bebidas' },
];

const PRODUCT: MenuProduct = {
  id: 'p-1',
  cafeteriaId: 'c-1',
  categoryId: 'k-2',
  categoryName: 'Bebidas',
  name: 'Café americano',
  description: '12 oz',
  price: 25.5,
  imageUrl: null,
  available: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** CL-Sprint4 28/10/2026: HU-07B. */
describe('ProductoFormComponent', () => {
  let fixture: ComponentFixture<ProductoFormComponent>;
  let el: HTMLElement;
  let facade: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

  const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!;
  const type = (id: string, value: string) => {
    const control = input(id);
    control.value = value;
    control.dispatchEvent(new Event('input'));
  };

  beforeAll(() => {
    // jsdom no implementa <dialog>.showModal()/close()
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
    // jsdom tampoco tiene URL.createObjectURL (vista previa de la imagen)
    URL.createObjectURL ??= () => 'blob:vista-previa';
    URL.revokeObjectURL ??= () => undefined;
  });

  async function render(
    product: MenuProduct | null = null,
    response: Observable<unknown> = of(PRODUCT),
  ) {
    facade = { create: vi.fn(() => response), update: vi.fn(() => response) };
    await TestBed.configureTestingModule({
      imports: [ProductoFormComponent],
      providers: [{ provide: MenuNegocioFacade, useValue: facade }],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('categories', CATEGORIES);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  it('abre el diálogo de alta con las categorías', async () => {
    await render();
    expect(el.querySelector('dialog')!.open).toBe(true);
    expect(el.textContent).toContain('Nuevo producto');
    const options = Array.from(el.querySelectorAll('option')).map((o) => o.textContent?.trim());
    expect(options).toEqual(['Sin categoría', 'Desayunos', 'Bebidas']);
  });

  it('exige nombre y precio mayor a 0 antes de llamar al backend', async () => {
    await render();
    button('Crear producto').click();
    await fixture.whenStable();
    expect(el.textContent).toContain('El nombre es obligatorio.');
    expect(el.textContent).toContain('El precio es obligatorio.');

    type('product-name', 'Café');
    type('product-price', '0');
    button('Crear producto').click();
    await fixture.whenStable();
    expect(el.textContent).toContain('El precio debe ser mayor a 0');
    expect(facade.create).not.toHaveBeenCalled();
  });

  it('crea con los datos limpios y emite el nombre', async () => {
    await render();
    const saved: string[] = [];
    fixture.componentInstance.saved.subscribe((n) => saved.push(n));
    type('product-name', '  Café de olla ');
    type('product-price', '18.5');
    button('Crear producto').click();
    await fixture.whenStable();
    expect(facade.create).toHaveBeenCalledWith(
      { name: 'Café de olla', description: null, price: 18.5, categoryId: null, available: true },
      null,
    );
    expect(saved).toEqual(['Café de olla']);
  });

  it('al editar rellena el formulario con los datos actuales y guarda con PUT', async () => {
    await render(PRODUCT, of(undefined));
    expect(el.textContent).toContain('Editar producto');
    expect(input('product-name').value).toBe('Café americano');
    expect(input('product-price').value).toBe('25.5');
    expect(el.querySelector<HTMLSelectElement>('#product-category')!.value).toBe('k-2');
    expect(input('product-available').checked).toBe(false);
    expect(el.querySelector('#product-image')).toBeNull();

    button('Guardar cambios').click();
    await fixture.whenStable();
    expect(facade.update).toHaveBeenCalledWith('p-1', {
      name: 'Café americano',
      description: '12 oz',
      price: 25.5,
      categoryId: 'k-2',
      available: false,
    });
  });

  it('muestra el error del backend y no cierra el diálogo', async () => {
    await render(
      null,
      throwError(() => ({ status: 409, message: 'Ya existe un producto con el nombre "Café"' })),
    );
    type('product-name', 'Café');
    type('product-price', '20');
    button('Crear producto').click();
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')!.textContent).toContain('Ya existe un producto');
    expect(el.querySelector('dialog')!.open).toBe(true);
  });

  it('con el 503 de imágenes ofrece guardar sin imagen', async () => {
    await render(
      null,
      throwError(() => ({
        status: 503,
        message: 'El servicio de imágenes no está disponible por ahora.',
      })),
    );
    type('product-name', 'Café');
    type('product-price', '20');
    const file = new File(['x'], 'cafe.png', { type: 'image/png' });
    const fileInput = input('product-image');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fileInput.dispatchEvent(new Event('change'));
    button('Crear producto').click();
    await fixture.whenStable();
    expect(el.textContent).toContain('El servicio de imágenes no está disponible por ahora.');

    facade.create.mockReturnValue(of(PRODUCT));
    button('Guardar sin imagen').click();
    await fixture.whenStable();
    expect(facade.create).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'Café' }), null);
  });

  it('avisa si la imagen no es JPEG, PNG o WebP', async () => {
    await render();
    const fileInput = input('product-image');
    Object.defineProperty(fileInput, 'files', {
      value: [new File(['x'], 'a.gif', { type: 'image/gif' })],
    });
    fileInput.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(el.textContent).toContain('Solo se aceptan imágenes JPEG, PNG o WebP.');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { MenuNegocioFacade } from '@features/menu-negocio/application/menu-negocio.facade';
import { Category, MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { BorradoresService } from '@core/services/borradores.service';
import { ConexionService } from '@core/services/conexion.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { BORRADOR_PRODUCTO, ProductoFormComponent, esBorradorProducto } from './producto-form.component';

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

/** CL-Sprint5 26/11/2026: borrador del formulario de producto y envío sin internet (patrón de Configuración). */
describe('ProductoFormComponent (borrador y sin conexión)', () => {
  const jwt = () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'none' })}.${b64({ sub: 'enc', role: 'AdminCafeteria', exp: 4102444800 })}.`;
  };
  const evento = (tipo: 'online' | 'offline') => window.dispatchEvent(new Event(tipo));

  let fixture: ComponentFixture<ProductoFormComponent>;
  let el: HTMLElement;
  let facade: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };

  const input = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!;
  const type = (id: string, value: string) => {
    input(id).value = value;
    input(id).dispatchEvent(new Event('input'));
  };
  const enviar = () => el.querySelector<HTMLButtonElement>('footer button[type="submit"]')!;
  const borrador = (id = 'nuevo') =>
    TestBed.inject(BorradoresService).leer(`${BORRADOR_PRODUCTO}.${id}`, esBorradorProducto);
  const refrescar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** Abre el diálogo (como tras recargar: no pasa por "Cancelar"). */
  async function abrir(product: MenuProduct | null = null) {
    fixture = TestBed.createComponent(ProductoFormComponent);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('categories', CATEGORIES);
    el = fixture.nativeElement;
    await refrescar();
  }

  beforeAll(() => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
  });

  beforeEach(async () => {
    localStorage.clear();
    facade = { create: vi.fn(() => of(PRODUCT)), update: vi.fn(() => of(PRODUCT)) };
    await TestBed.configureTestingModule({
      imports: [ProductoFormComponent],
      providers: [{ provide: MenuNegocioFacade, useValue: facade }],
    }).compileComponents();
    TestBed.inject(TokenStorageService).set(jwt());
    TestBed.inject(ConexionService); // en la app ya existe desde el arranque
  });

  afterEach(() => {
    evento('online');
    localStorage.clear();
  });

  it('el alta a medias se recupera al volver a abrir y avisa que la imagen no se guarda', async () => {
    await abrir();
    type('product-name', 'Café de olla');
    type('product-price', '18.5');
    await refrescar();
    expect(borrador()).toMatchObject({ name: 'Café de olla', price: 18.5 });

    fixture.destroy();
    await abrir();
    expect(input('product-name').value).toBe('Café de olla');
    expect(input('product-price').value).toBe('18.5');
    const nota = el.querySelector('.cb-borrador')!.textContent!;
    expect(nota).toContain('Recuperamos cambios sin guardar');
    expect(nota).toContain('vuelve a elegirla');
  });

  it('cada producto tiene su borrador: el de una edición no aparece en el alta', async () => {
    await abrir(PRODUCT);
    type('product-name', 'Café americano grande');
    await refrescar();
    expect(borrador('p-1')?.name).toBe('Café americano grande');
    fixture.destroy();

    await abrir();
    expect(input('product-name').value).toBe('');
    expect(el.querySelector('.cb-borrador')).toBeNull();
    fixture.destroy();

    await abrir(PRODUCT);
    expect(input('product-name').value).toBe('Café americano grande');
    expect(el.querySelector('.cb-borrador')!.textContent).not.toContain('vuelve a elegirla');
  });

  it('sin internet no envía; al volver habilita «Reintentar», guarda y borra el borrador', async () => {
    await abrir();
    type('product-name', 'Café de olla');
    type('product-price', '18.5');
    evento('offline');
    enviar().click();
    await refrescar();
    expect(facade.create).not.toHaveBeenCalled();
    expect(el.querySelector('.cb-alert-error')!.textContent).toContain('Sin conexión');
    expect(enviar().textContent).toContain('Reintentar');
    expect(enviar().disabled).toBe(true);
    expect(borrador()?.name).toBe('Café de olla');

    evento('online');
    await refrescar();
    expect(enviar().disabled).toBe(false);
    expect(facade.create).not.toHaveBeenCalled(); // nunca se reenvía solo
    enviar().click();
    await refrescar();
    expect(facade.create).toHaveBeenCalledTimes(1);
    expect(borrador()).toBeNull();
  });

  it('"Descartar" vuelve a los datos del producto y "Cancelar" descarta el borrador', async () => {
    await abrir(PRODUCT);
    type('product-name', 'Otro nombre');
    await refrescar();
    fixture.destroy();
    await abrir(PRODUCT);
    (el.querySelector('.cb-borrador .cb-link') as HTMLButtonElement).click();
    await refrescar();
    expect(input('product-name').value).toBe('Café americano');
    expect(borrador('p-1')).toBeNull();

    type('product-name', 'Otro más');
    await refrescar();
    expect(borrador('p-1')?.name).toBe('Otro más');
    [...el.querySelectorAll<HTMLButtonElement>('footer button')].find((b) => b.textContent!.includes('Cancelar'))!.click();
    await refrescar();
    expect(borrador('p-1')).toBeNull();
  });
});

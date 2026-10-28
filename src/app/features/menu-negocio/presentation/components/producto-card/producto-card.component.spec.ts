import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuProduct } from '@features/menu-negocio/domain/models/menu.model';
import { PRODUCT_PLACEHOLDER, ProductoCardComponent } from './producto-card.component';

const PRODUCT: MenuProduct = {
  id: 'p-1',
  cafeteriaId: 'c-1',
  categoryId: null,
  categoryName: null,
  name: 'Chilaquiles verdes',
  description: 'Con pollo y crema',
  price: 55,
  imageUrl: null,
  available: true,
  createdAt: new Date('2026-10-01T12:00:00Z'),
  updatedAt: new Date('2026-10-01T12:00:00Z'),
};

/** CL-Sprint4 28/10/2026: HU-07B. */
describe('ProductoCardComponent', () => {
  let fixture: ComponentFixture<ProductoCardComponent>;
  let el: HTMLElement;

  const button = (text: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!;

  async function render(product: MenuProduct = PRODUCT, pending = false) {
    await TestBed.configureTestingModule({ imports: [ProductoCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ProductoCardComponent);
    fixture.componentRef.setInput('product', product);
    fixture.componentRef.setInput('pending', pending);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  it('muestra nombre, precio, "Sin categoría" y la imagen por defecto', async () => {
    await render();
    expect(el.textContent).toContain('Chilaquiles verdes');
    expect(el.textContent).toContain('$55.00');
    expect(el.textContent).toContain('Sin categoría');
    expect(el.querySelector('img')!.getAttribute('src')).toBe(PRODUCT_PLACEHOLDER);
  });

  it('marca la tarjeta inactiva cuando no está disponible', async () => {
    await render({ ...PRODUCT, available: false, categoryName: 'Desayunos' });
    expect(el.querySelector('.product-card')!.classList).toContain('inactive');
    expect(el.textContent).toContain('Desayunos');
    expect(el.textContent).toContain('No disponible');
  });

  it('emite el nuevo valor del toggle', async () => {
    await render();
    const values: boolean[] = [];
    fixture.componentInstance.availabilityChange.subscribe((v) => values.push(v));
    const toggle = el.querySelector<HTMLInputElement>('input[role="switch"]')!;
    toggle.click();
    expect(values).toEqual([false]);
  });

  it('el menú "⋯" ofrece Editar, Cambiar imagen y Eliminar y emite la acción', async () => {
    await render();
    const edited: MenuProduct[] = [];
    const removed: MenuProduct[] = [];
    fixture.componentInstance.edit.subscribe((p) => edited.push(p));
    fixture.componentInstance.remove.subscribe((p) => removed.push(p));

    expect(el.querySelector('[role="menu"]')).toBeNull();
    button('Opciones').click();
    await fixture.whenStable();
    const items = Array.from(el.querySelectorAll('[role="menuitem"]')).map((b) =>
      b.textContent?.trim(),
    );
    expect(items).toEqual(['Editar', 'Cambiar imagen', 'Eliminar']);

    button('Editar').click();
    await fixture.whenStable();
    expect(edited).toEqual([PRODUCT]);
    expect(el.querySelector('[role="menu"]')).toBeNull();

    button('Opciones').click();
    await fixture.whenStable();
    button('Eliminar').click();
    expect(removed).toEqual([PRODUCT]);
  });

  it('bloquea el toggle y el menú mientras hay una petición en curso', async () => {
    await render(PRODUCT, true);
    expect(el.querySelector<HTMLInputElement>('input[role="switch"]')!.disabled).toBe(true);
    expect(button('Opciones').disabled).toBe(true);
  });
});

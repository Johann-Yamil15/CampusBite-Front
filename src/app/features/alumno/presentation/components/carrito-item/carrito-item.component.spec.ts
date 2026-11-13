// FB-Sprint4 01/11/2026: Pruebas de la fila del carrito (tope de 20, subtotal y eliminación en 0).
// CL-Sprint5 11/11/2026: mismos casos, ahora sobre app-cantidad (sin Angular Material).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { ItemCarrito } from '@features/alumno/domain/models/carrito.model';
import { CarritoItemComponent } from './carrito-item.component';

describe('CarritoItemComponent', () => {
  let fixture: ComponentFixture<CarritoItemComponent>;
  let carrito: CarritoStore;
  let el: HTMLElement;

  const base: ItemCarrito = {
    idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
    imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
  };

  // Sincroniza el input con el estado del store (como lo hace el drawer)
  async function render(): Promise<void> {
    if (carrito.items()[0]) fixture.componentRef.setInput('item', carrito.items()[0]);
    await fixture.whenStable();
  }
  const menos = () => el.querySelectorAll<HTMLButtonElement>('button.paso')[0];
  const mas = () => el.querySelectorAll<HTMLButtonElement>('button.paso')[1];
  const subtotal = () => el.querySelector('.ci-subtotal')!.textContent!.trim();

  async function crear(cantidad: number): Promise<void> {
    await TestBed.configureTestingModule({ imports: [CarritoItemComponent] }).compileComponents();
    carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();
    carrito.agregar({ ...base, cantidad });
    fixture = TestBed.createComponent(CarritoItemComponent);
    el = fixture.nativeElement;
    await render();
  }

  it('calcula el subtotal y lo recalcula al sumar', async () => {
    await crear(2);
    expect(subtotal()).toBe('$76.00');
    mas().click();
    await render();
    expect(carrito.items()[0].cantidad).toBe(3);
    expect(subtotal()).toBe('$114.00');
  });

  it('en 20 deshabilita "+" y no pasa del tope', async () => {
    await crear(20);
    expect(mas().disabled).toBe(true);
    mas().click();
    await render();
    expect(carrito.items()[0].cantidad).toBe(20);
  });

  it('con más de 1, "−" solo resta una unidad', async () => {
    await crear(3);
    menos().click();
    await render();
    expect(carrito.items()[0].cantidad).toBe(2);
  });

  it('en 1, "−" es "quitar" y deja el carrito vacío', async () => {
    await crear(1);
    expect(menos().getAttribute('aria-label')).toBe('Quitar Latte Helado');
    menos().click();
    expect(carrito.isEmpty()).toBe(true);
  });

  it('sin imagen usa la de reemplazo', async () => {
    await crear(1);
    expect(el.querySelector('img')!.getAttribute('src')).toContain('producto-sin-imagen.svg');
  });
});

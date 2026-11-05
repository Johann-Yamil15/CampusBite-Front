// FB-Sprint4 01/11/2026: Pruebas de la fila del carrito (tope de 20, subtotal y eliminación en 0).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { CarritoItemComponent } from './carrito-item';
import { CarritoService } from '../../../services/carrito';
import { ItemCarrito } from '../../../models/menu.model';

describe('CarritoItemComponent', () => {
  let component: CarritoItemComponent;
  let fixture: ComponentFixture<CarritoItemComponent>;
  let carrito: CarritoService;
  let el: HTMLElement;

  const base: ItemCarrito = {
    idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
    imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
  };

  // FB-Sprint4 01/11/2026: sincroniza el input con el estado actual del store (como lo hace el drawer)
  async function render(): Promise<void> {
    fixture.componentRef.setInput('item', carrito.items()[0]);
    await fixture.whenStable();
  }

  const botones = () => el.querySelectorAll<HTMLButtonElement>('.stepper-btn');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarritoItemComponent],
    }).compileComponents();

    carrito = TestBed.inject(CarritoService);
    carrito.vaciar();
    carrito.agregar({ ...base });

    fixture = TestBed.createComponent(CarritoItemComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    await render();
  });

  it('se crea con el producto del carrito', () => {
    expect(component).toBeTruthy();
    expect(el.querySelector('.item-nombre')?.textContent).toContain('Latte Helado');
  });

  describe('subtotal', () => {
    it('calcula precio * cantidad', async () => {
      carrito.cambiarCantidad('p1', 3);
      await render();
      expect(component.subtotal()).toBe(114);
      expect(el.querySelector('.item-subtotal')?.textContent).toContain('114.00');
    });

    it('se recalcula al incrementar', async () => {
      component.incrementar();
      await render();
      expect(carrito.items()[0].cantidad).toBe(2);
      expect(component.subtotal()).toBe(76);
    });
  });

  describe('tope de 20 unidades', () => {
    it('no incrementa más allá de 20', async () => {
      carrito.cambiarCantidad('p1', 20);
      await render();
      const spy = vi.spyOn(carrito, 'cambiarCantidad');

      component.incrementar();

      expect(spy).not.toHaveBeenCalled();
      expect(carrito.items()[0].cantidad).toBe(20);
    });

    it('deshabilita el botón + y muestra el aviso en 20', async () => {
      carrito.cambiarCantidad('p1', 20);
      await render();
      expect(component.enLimite()).toBe(true);
      expect(botones()[1].disabled).toBe(true);
      expect(el.querySelector('.aviso-limite')).not.toBeNull();
    });

    it('el botón + está habilitado en 19', async () => {
      carrito.cambiarCantidad('p1', 19);
      await render();
      expect(botones()[1].disabled).toBe(false);
      expect(el.querySelector('.aviso-limite')).toBeNull();
    });
  });

  describe('eliminación', () => {
    it('al bajar de 1 a 0 llama a quitar() y el carrito queda vacío', () => {
      const spy = vi.spyOn(carrito, 'quitar');
      component.decrementar();
      expect(spy).toHaveBeenCalledWith('p1');
      expect(carrito.isEmpty()).toBe(true);
    });

    it('con cantidad > 1 el botón - solo resta una unidad', async () => {
      carrito.cambiarCantidad('p1', 2);
      await render();
      const spy = vi.spyOn(carrito, 'quitar');
      botones()[0].click();
      expect(spy).not.toHaveBeenCalled();
      expect(carrito.items()[0].cantidad).toBe(1);
    });

    it('el botón de basurero quita el producto aunque tenga varias unidades', async () => {
      carrito.cambiarCantidad('p1', 5);
      await render();
      const spy = vi.spyOn(carrito, 'quitar');
      el.querySelector<HTMLButtonElement>('.btn-eliminar')!.click();
      expect(spy).toHaveBeenCalledWith('p1');
      expect(carrito.isEmpty()).toBe(true);
    });
  });

  it('muestra el placeholder cuando no hay imagen', () => {
    expect(el.querySelector('.placeholder-img')).not.toBeNull();
    expect(el.querySelector('img')).toBeNull();
  });
});

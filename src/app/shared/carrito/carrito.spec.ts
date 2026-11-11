// FB-Sprint4 01/11/2026: Pruebas del signal store del carrito (totales, tope de 20 y cafetería única).
import { TestBed } from '@angular/core/testing';

import { CarritoService } from './carrito';
import { ItemCarrito } from '@shared/menu/menu.model';

describe('CarritoService', () => {
  let carrito: CarritoService;

  const latte: ItemCarrito = {
    idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
    imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
  };
  const croissant: ItemCarrito = { ...latte, idProducto: 'p2', producto: 'Croissant', precio: 45 };
  const deOtraCafeteria: ItemCarrito = { ...latte, idProducto: 'x1', idCafeteria: 'c2', cafeteria: 'Snack Bar' };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    carrito = TestBed.inject(CarritoService);
  });

  it('inicia vacío', () => {
    expect(carrito.isEmpty()).toBe(true);
    expect(carrito.totalItems()).toBe(0);
    expect(carrito.totalPrecio()).toBe(0);
    expect(carrito.idCafeteria()).toBeNull();
  });

  it('calcula totales reactivos', () => {
    carrito.agregar(latte);
    carrito.agregar({ ...croissant, cantidad: 2 });
    expect(carrito.totalItems()).toBe(3);
    expect(carrito.totalPrecio()).toBe(38 + 90);
    expect(carrito.cafeteria()).toBe('Cafetería Central');
  });

  it('agregar un producto existente suma cantidades en lugar de duplicarlo', () => {
    carrito.agregar(latte);
    carrito.agregar(latte);
    expect(carrito.items().length).toBe(1);
    expect(carrito.items()[0].cantidad).toBe(2);
  });

  it('agregar respeta el tope de 20 (existente y nuevo)', () => {
    carrito.agregar({ ...latte, cantidad: 19 });
    carrito.agregar({ ...latte, cantidad: 5 });
    carrito.agregar({ ...croissant, cantidad: 50 });
    expect(carrito.items()[0].cantidad).toBe(20);
    expect(carrito.items()[1].cantidad).toBe(20);
  });

  it('rechaza productos de otra cafetería sin modificar el carrito', () => {
    carrito.agregar(latte);
    expect(() => carrito.agregar(deOtraCafeteria)).toThrow(/Cafetería Central/);
    expect(carrito.items().length).toBe(1);
  });

  it('tras vaciar permite agregar de otra cafetería', () => {
    carrito.agregar(latte);
    carrito.vaciar();
    carrito.agregar(deOtraCafeteria);
    expect(carrito.idCafeteria()).toBe('c2');
  });

  it('cambiarCantidad limita a 20 y elimina en 0 o menos', () => {
    carrito.agregar(latte);
    carrito.agregar(croissant);
    carrito.cambiarCantidad('p1', 99);
    expect(carrito.items()[0].cantidad).toBe(20);
    carrito.cambiarCantidad('p1', 0);
    carrito.cambiarCantidad('p2', -1);
    expect(carrito.isEmpty()).toBe(true);
  });

  it('al quitar el último producto se libera la cafetería', () => {
    carrito.agregar(latte);
    carrito.quitar('p1');
    expect(carrito.idCafeteria()).toBeNull();
    expect(() => carrito.agregar(deOtraCafeteria)).not.toThrow();
  });
});

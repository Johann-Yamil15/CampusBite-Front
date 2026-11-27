// FB-Sprint4 01/11/2026 (CL-Sprint5 11/11/2026: movido a alumno/application): Pruebas del signal store del carrito (totales, tope de 20 y cafetería única).
import { TestBed } from '@angular/core/testing';
import { TokenStorageService } from '@core/services/token-storage.service';

import { CarritoStore } from './carrito.store';
import { ItemCarrito } from '@features/alumno/domain/models/carrito.model';

describe('CarritoStore', () => {
  let carrito: CarritoStore;

  const latte: ItemCarrito = {
    idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
    imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
  };
  const croissant: ItemCarrito = { ...latte, idProducto: 'p2', producto: 'Croissant', precio: 45 };
  const deOtraCafeteria: ItemCarrito = { ...latte, idProducto: 'x1', idCafeteria: 'c2', cafeteria: 'Snack Bar' };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    carrito = TestBed.inject(CarritoStore);
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

/** CL-Sprint5 26/11/2026: el carrito sobrevive a recargar y es de cada usuario. */
describe('CarritoStore (borrador por usuario)', () => {
  const jwt = (sub: string) => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'none' })}.${b64({ sub, role: 'Alumno', exp: 4102444800 })}.`;
  };
  const latte: ItemCarrito = {
    idProducto: 'p1', producto: 'Latte', precio: 38, cantidad: 2,
    imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
  };

  /** Simula recargar la página: servicios nuevos, mismo localStorage. */
  function recargar(): CarritoStore {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(CarritoStore);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  afterEach(() => localStorage.clear());

  it('se recupera al recargar con la misma sesión', () => {
    TestBed.inject(TokenStorageService).set(jwt('ana'));
    const carrito = TestBed.inject(CarritoStore);
    carrito.agregar(latte);
    TestBed.tick();

    const recargado = recargar();
    expect(recargado.items()).toEqual([latte]);
    expect(recargado.idCafeteria()).toBe('c1');
  });

  it('otro usuario no ve el carrito del primero; al volver, el primero lo recupera', () => {
    const tokens = TestBed.inject(TokenStorageService);
    tokens.set(jwt('ana'));
    const carrito = TestBed.inject(CarritoStore);
    carrito.agregar(latte);
    TestBed.tick();

    tokens.set(jwt('beto'));
    expect(carrito.isEmpty()).toBe(true);
    tokens.set(jwt('ana'));
    expect(carrito.items()).toEqual([latte]);
  });

  it('vaciar (pedido hecho) borra el borrador', () => {
    TestBed.inject(TokenStorageService).set(jwt('ana'));
    const carrito = TestBed.inject(CarritoStore);
    carrito.agregar(latte);
    TestBed.tick();
    carrito.vaciar();
    TestBed.tick();
    expect(recargar().isEmpty()).toBe(true);
  });

  it('ignora un borrador manipulado (cantidad fuera de rango o cafeterías mezcladas)', () => {
    TestBed.inject(TokenStorageService).set(jwt('ana'));
    const sobre = (datos: unknown) => JSON.stringify({ v: 1, en: Date.now(), datos });
    localStorage.setItem('cb.borrador.ana.carrito', sobre([{ ...latte, cantidad: 99 }]));
    expect(recargar().isEmpty()).toBe(true);
    localStorage.setItem('cb.borrador.ana.carrito', sobre([latte, { ...latte, idProducto: 'p2', idCafeteria: 'c2' }]));
    expect(recargar().isEmpty()).toBe(true);
  });
});

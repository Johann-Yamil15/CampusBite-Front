// FB-Sprint4 01/11/2026: Pruebas del producto del catálogo (agregar, tope de 20 y cafetería distinta).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { ProductoItemComponent } from './producto-item.component';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { ProductoMenu } from '@features/catalogo';

describe('ProductoItemComponent', () => {
  let component: ProductoItemComponent;
  let fixture: ComponentFixture<ProductoItemComponent>;
  let carrito: CarritoStore;
  let accion: Subject<void>;
  let snackOpen: ReturnType<typeof vi.fn>;

  const producto: ProductoMenu = {
    idProducto: 'p1', producto: 'Latte Helado', categoria: 'Cafés',
    descripcion: null, precio: 38, imagenUrl: null,
  };

  beforeEach(async () => {
    accion = new Subject<void>();

    await TestBed.configureTestingModule({
      imports: [ProductoItemComponent],
    }).compileComponents();

    carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();

    fixture = TestBed.createComponent(ProductoItemComponent);
    component = fixture.componentInstance;
    // MatSnackBarModule registra su propio MatSnackBar en el componente, se espía esa instancia
    const snack = fixture.debugElement.injector.get(MatSnackBar);
    snackOpen = vi.fn().mockReturnValue({ onAction: () => accion });
    vi.spyOn(snack, 'open').mockImplementation(snackOpen as never);
    fixture.componentRef.setInput('producto', producto);
    fixture.componentRef.setInput('idCafeteria', 'c1');
    fixture.componentRef.setInput('cafeteria', 'Cafetería Central');
    await fixture.whenStable();
  });

  it('agrega el producto al carrito', () => {
    component.agregar();
    expect(carrito.items()[0]).toMatchObject({ idProducto: 'p1', cantidad: 1, idCafeteria: 'c1' });
  });

  it('no muestra "Agregado" si ya está en 20', () => {
    carrito.agregar({ ...producto, cantidad: 20, idCafeteria: 'c1', cafeteria: 'Cafetería Central' });
    component.agregar();
    expect(snackOpen).toHaveBeenCalledWith(expect.stringContaining('Máximo 20'), 'Cerrar', expect.anything());
    expect(carrito.items()[0].cantidad).toBe(20);
  });

  it('si hay otra cafetería ofrece vaciar y al aceptar agrega el nuevo producto', () => {
    carrito.agregar({ ...producto, idProducto: 'x1', idCafeteria: 'c2', cafeteria: 'Snack Bar', cantidad: 1 });
    component.agregar();
    expect(carrito.idCafeteria()).toBe('c2');

    accion.next();

    expect(carrito.items().length).toBe(1);
    expect(carrito.idCafeteria()).toBe('c1');
  });
});

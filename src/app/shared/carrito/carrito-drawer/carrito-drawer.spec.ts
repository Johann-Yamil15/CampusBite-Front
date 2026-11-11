// FB-Sprint4 01/11/2026: Pruebas del panel del carrito (apertura del modal y vaciado).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CarritoDrawerComponent } from './carrito-drawer';
import { CarritoService } from '@shared/carrito/carrito';

describe('CarritoDrawerComponent', () => {
  let component: CarritoDrawerComponent;
  let fixture: ComponentFixture<CarritoDrawerComponent>;
  let carrito: CarritoService;
  const dialog = { open: vi.fn(), openDialogs: [] as unknown[] };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CarritoDrawerComponent],
      providers: [{ provide: MatDialog, useValue: dialog }],
    }).compileComponents();

    carrito = TestBed.inject(CarritoService);
    fixture = TestBed.createComponent(CarritoDrawerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('abierto', true);
    await fixture.whenStable();
  });

  it('renderiza un item por producto del carrito', async () => {
    carrito.agregar({
      idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('app-carrito-item').length).toBe(1);
  });

  it('no abre el modal con el carrito vacío', () => {
    component.confirmar();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('cuando el modal devuelve true vacía el carrito y cierra el panel', () => {
    carrito.agregar({
      idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    component.confirmar();
    expect(carrito.isEmpty()).toBe(true);
    expect(component.abierto()).toBe(false);
  });

  it('cuando el modal se cancela conserva el carrito y el panel abierto', () => {
    carrito.agregar({
      idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 1,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });
    component.confirmar();
    expect(carrito.totalItems()).toBe(1);
    expect(component.abierto()).toBe(true);
  });

  it('el FAB muestra el badge con el total de productos y abre el panel', async () => {
    fixture.componentRef.setInput('abierto', false);
    carrito.agregar({
      idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 3,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });
    await fixture.whenStable();
    const fab: HTMLButtonElement = fixture.nativeElement.querySelector('.carrito-fab');
    expect(fab.textContent).toContain('3');
    fab.click();
    expect(component.abierto()).toBe(true);
  });
});

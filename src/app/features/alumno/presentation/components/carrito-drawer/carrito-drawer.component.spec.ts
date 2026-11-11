// FB-Sprint4 01/11/2026: Pruebas del panel del carrito.
// CL-Sprint5 11/11/2026: reescritas para el carrito sin Angular Material (etapa 5).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';
import { CarritoDrawerComponent } from './carrito-drawer.component';

describe('CarritoDrawerComponent', () => {
  let fixture: ComponentFixture<CarritoDrawerComponent>;
  let el: HTMLElement;
  let carrito: CarritoStore;
  let ui: CarritoUiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarritoDrawerComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    carrito = TestBed.inject(CarritoStore);
    ui = TestBed.inject(CarritoUiService);
    carrito.vaciar();
    fixture = TestBed.createComponent(CarritoDrawerComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const agregarLatte = () =>
    carrito.agregar({
      idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 2,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });

  it('cerrado no dibuja nada; abierto muestra el panel', async () => {
    expect(el.querySelector('.cd')).toBeNull();
    ui.abrir();
    await fixture.whenStable();
    expect(el.querySelector('.cd')).not.toBeNull();
  });

  it('vacío ofrece explorar cafeterías', async () => {
    ui.abrir();
    await fixture.whenStable();
    expect(el.querySelector('.cd-vacio')!.textContent).toContain('Tu carrito está vacío');
    expect(el.querySelector('.cd-pie')).toBeNull();
  });

  it('muestra una fila por producto, la cafetería y el total', async () => {
    agregarLatte();
    ui.abrir();
    await fixture.whenStable();
    expect(el.querySelectorAll('app-carrito-item').length).toBe(1);
    expect(el.querySelector('.cd-cafeteria')!.textContent).toContain('Cafetería Central');
    expect(el.querySelector('.cd-total')!.textContent).toContain('$76.00');
  });

  it('vaciar pide confirmación', async () => {
    agregarLatte();
    ui.abrir();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('.cd-vaciar')!.click();
    await fixture.whenStable();
    expect(carrito.isEmpty()).toBe(false);

    el.querySelector<HTMLButtonElement>('.cd-confirmar .cb-btn--danger')!.click();
    await fixture.whenStable();
    expect(carrito.isEmpty()).toBe(true);
  });

  it('"Continuar" cierra el carrito y abre el checkout', async () => {
    agregarLatte();
    ui.abrir();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('.cd-pie .cb-btn--primary')!.click();
    expect(ui.abierto()).toBe(false);
    expect(ui.checkoutAbierto()).toBe(true);
  });

  it('Escape lo cierra', async () => {
    ui.abrir();
    await fixture.whenStable();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(ui.abierto()).toBe(false);
  });
});

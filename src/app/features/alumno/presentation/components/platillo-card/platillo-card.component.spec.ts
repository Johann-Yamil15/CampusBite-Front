import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlatilloCatalogo } from '@features/catalogo';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { provideFavoritos } from '@features/alumno/alumno.providers';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { PlatilloCardComponent } from './platillo-card.component';

const LATTE: PlatilloCatalogo = {
  idProducto: 'p1',
  producto: 'Latte Helado',
  categoria: 'Bebidas',
  descripcion: 'Con hielo',
  precio: 38,
  imagenUrl: null,
  calificacion: 4.7,
  minutosPreparacion: 4,
  precioAnterior: 45,
  popular: true,
  dietas: ['vegetariano'],
  idCafeteria: 'c1',
  cafeteria: 'Café Express',
  cafeteriaAbierta: true,
};

/**
 * CL-Sprint5 11/11/2026: "+" rápido, contador y aviso de otra cafetería. Reemplaza las pruebas de
 * producto-item (FB-Sprint4), que cubrían lo mismo con el snackbar de Material.
 */
describe('PlatilloCardComponent', () => {
  let fixture: ComponentFixture<PlatilloCardComponent>;
  let el: HTMLElement;
  let carrito: CarritoStore;

  async function crear(cerrada = false): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PlatilloCardComponent],
      providers: [provideFavoritos(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();
    fixture = TestBed.createComponent(PlatilloCardComponent);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('platillo', LATTE);
    fixture.componentRef.setInput('cerrada', cerrada);
    await fixture.whenStable();
  }

  it('muestra la oferta calculada del precio anterior', async () => {
    await crear();
    expect(el.querySelector('.pc-oferta')!.textContent!.trim()).toBe('-16%');
  });

  it('"+" agrega uno y se convierte en contador', async () => {
    await crear();
    el.querySelector<HTMLButtonElement>('.pc-agregar')!.click();
    await fixture.whenStable();

    expect(carrito.items()[0]).toMatchObject({ idProducto: 'p1', cantidad: 1, idCafeteria: 'c1' });
    expect(el.querySelector('.pc-agregar')).toBeNull();
    expect(el.querySelector('app-cantidad .valor')!.textContent!.trim()).toBe('1');
  });

  it('con otra cafetería en el carrito pregunta antes de vaciar', async () => {
    await crear();
    carrito.agregar({ ...LATTE, idProducto: 'x1', idCafeteria: 'c2', cafeteria: 'Snack Point', cantidad: 2, precio: 25 });
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('.pc-agregar')!.click();
    await fixture.whenStable();

    // No se tocó el carrito: primero se pregunta
    expect(carrito.idCafeteria()).toBe('c2');
    expect(el.querySelector('app-modal')!.textContent).toContain('Snack Point');

    el.querySelector<HTMLButtonElement>('app-modal .cb-btn--primary')!.click();
    await fixture.whenStable();

    expect(carrito.items().length).toBe(1);
    expect(carrito.idCafeteria()).toBe('c1');
  });

  it('"Conservar mi carrito" cierra el aviso sin cambiar nada', async () => {
    await crear();
    carrito.agregar({ ...LATTE, idProducto: 'x1', idCafeteria: 'c2', cafeteria: 'Snack Point', cantidad: 1 });
    el.querySelector<HTMLButtonElement>('.pc-agregar')!.click();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('app-modal .cb-btn--secondary')!.click();
    await fixture.whenStable();

    expect(el.querySelector('app-modal')).toBeNull();
    expect(carrito.idCafeteria()).toBe('c2');
  });

  it('si la cafetería está cerrada no se puede agregar', async () => {
    await crear(true);
    expect(el.querySelector('.pc-agregar')).toBeNull();
    expect(el.textContent).toContain('No disponible');
  });
});

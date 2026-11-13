import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@features/catalogo/data/mock/catalogo.mock-data';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { FavoritosPage } from './favoritos.page';
import { provideCatalogoMock } from '@features/catalogo/data/mock/catalogo-mock.providers';
import { provideFavoritosMock } from '@features/alumno/data/mock/alumno-mock.providers';

/** CL-Sprint5 11/11/2026 (etapa 7): Favoritos con pestañas, disponibilidad, vacío y error. */
describe('FavoritosPage', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let fixture: ComponentFixture<FavoritosPage>;
  let el: HTMLElement;

  async function abrir(ver?: string, antes?: (f: FavoritosFacade) => void) {
    await TestBed.configureTestingModule({
      imports: [FavoritosPage],
      providers: [provideRouter([]), provideCatalogoMock(), provideFavoritosMock(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    antes?.(TestBed.inject(FavoritosFacade));
    fixture = TestBed.createComponent(FavoritosPage);
    el = fixture.nativeElement;
    if (ver) fixture.componentRef.setInput('ver', ver);
    await fixture.whenStable();
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  const tarjeta = (texto: string) =>
    [...el.querySelectorAll<HTMLElement>('.fv-grid > li')].find((li) => li.textContent!.includes(texto))!;

  it('platillos: "Agregar" en los disponibles, cerrado y ya no disponible', async () => {
    await abrir();
    expect(el.querySelector('#tab-platillo')!.getAttribute('aria-selected')).toBe('true');
    expect(el.querySelectorAll('.fv-grid > li').length).toBe(4);
    expect(tarjeta('Sándwich').querySelector('.pc-agregar-texto')!.textContent).toContain('Agregar');
    expect(tarjeta('Latte').textContent).toContain('Cerrada ahora');
    expect(tarjeta('Latte').querySelector('.pc-agregar-texto')).toBeNull();
    const retirado = tarjeta('Malteada');
    expect(retirado.textContent).toContain('Ya no disponible');
    expect(retirado.querySelector('a')!.getAttribute('href')).toBe(`/cafeterias/${DEMO_CAFETERIA.sabor}`);
  });

  it('"Agregar" usa el flujo del carrito y avisa si es de otra cafetería', async () => {
    await abrir();
    const carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();
    tarjeta('Sándwich').querySelector<HTMLButtonElement>('.pc-agregar-texto')!.click();
    await fixture.whenStable();
    expect(carrito.items().map((i) => i.idProducto)).toEqual([DEMO_PRODUCTO.sandwich]);

    tarjeta('Bowl').querySelector<HTMLButtonElement>('.pc-agregar-texto')!.click();
    await fixture.whenStable();
    expect(el.querySelector('app-modal')!.textContent).toContain('¿Empezar un carrito nuevo?');
    carrito.vaciar();
  });

  it('cafeterías: llevan a su tienda y dicen si están abiertas', async () => {
    await abrir('cafeterias');
    expect(el.querySelector('#tab-cafeteria')!.getAttribute('aria-selected')).toBe('true');
    expect(el.querySelectorAll('app-cafeteria-card').length).toBe(3);
    expect(tarjeta('Café Express').textContent).toContain('Cerrada ahora');
    expect(tarjeta('Cafetería Central').querySelector('a')!.getAttribute('href')).toBe(
      `/cafeterias/${DEMO_CAFETERIA.central}`,
    );
  });

  it('quitar con el corazón lo saca de la lista', async () => {
    await abrir('cafeterias');
    tarjeta('Rincón Verde').querySelector<HTMLButtonElement>('app-corazon button')!.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('app-cafeteria-card').length).toBe(2);
  });

  it('sin favoritos invita a explorar', async () => {
    await abrir(undefined, (f) => {
      vi.spyOn(f, 'platillos').mockReturnValue([]);
    });
    expect(el.querySelector('.vacio h2')!.textContent).toContain('Aún no tienes platillos favoritos');
    expect(el.querySelector('.vacio a')!.getAttribute('href')).toBe('/buscar');
  });

  it('si falla muestra el error y "Reintentar" vuelve a cargar', async () => {
    let fallar = true;
    await abrir(undefined, (f) => {
      const real = f.cargar.bind(f);
      vi.spyOn(f, 'cargar').mockImplementation((forzar) =>
        fallar ? throwError(() => ({ status: 0, message: 'Sin conexión' })) : real(forzar),
      );
    });
    expect(el.querySelector('.fv-error')!.textContent).toContain('Sin conexión');
    fallar = false;
    el.querySelector<HTMLButtonElement>('.fv-error button')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.fv-error')).toBeNull();
    expect(el.querySelectorAll('.fv-grid > li').length).toBe(4);
  });
});

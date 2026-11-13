import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { AuthFacade } from '@features/auth';
import { MisPedidosFacade } from '@features/ordenes';
import { InicioPage } from './inicio.page';
import { provideCatalogoMock } from '@features/catalogo/data/mock/catalogo-mock.providers';
import { provideOrdenesMock } from '@features/ordenes/data/mock/ordenes-mock.providers';
import { provideFavoritosMock, providePerfilMock } from '@features/alumno/data/mock/alumno-mock.providers';

/** CL-Sprint5 11/11/2026: el inicio arma sus secciones con el catálogo mock (sin latencia). */
describe('InicioPage', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let fixture: ComponentFixture<InicioPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioPage],
      providers: [
        provideRouter([]),
        provideCatalogoMock(),
        provideOrdenesMock(),
        provideFavoritosMock(),
        providePerfilMock(),
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
        {
          provide: AuthFacade,
          useValue: { user: signal({ email: 'juan.perez@uttt.edu.mx', name: 'Juan Pérez' }), loadCurrentUser: () => of(null) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioPage);
    el = fixture.nativeElement;
    // El pedido activo sale de "Mis pedidos": se cargan como lo hace el layout
    TestBed.inject(MisPedidosFacade).cargar().subscribe();
    await fixture.whenStable();
  });

  it('saluda por nombre y no repite el buscador (vive en la barra superior)', () => {
    expect(el.querySelector('h1')!.textContent).toContain('Juan');
    expect(el.querySelector('input[type="search"]')).toBeNull();
  });

  it('muestra promociones, categorías, cafeterías y populares', () => {
    // 3 de la plataforma + 2 activas del encargado de Cafetería Central (etapa 9)
    // CL-Sprint5 13/11/2026: las 3 de prueba (las del negocio ya no se mezclan en el mock)
    expect(el.querySelectorAll('.in-promo').length).toBe(3);
    expect(el.querySelectorAll('.in-categoria').length).toBeGreaterThan(0);
    expect(el.querySelectorAll('app-cafeteria-card').length).toBe(6);
    expect(el.querySelectorAll('app-platillo-card').length).toBeGreaterThan(0);
  });

  it('las cafeterías abiertas van primero', () => {
    const tarjetas = [...el.querySelectorAll('app-cafeteria-card')];
    const ultima = tarjetas.at(-1)!;
    expect(ultima.textContent).toContain('Café Express'); // la única cerrada del mock
  });

  it('el pedido listo para recoger aparece como atajo', () => {
    expect(el.querySelector('.in-activo.listo')!.textContent).toContain('listo para recoger');
  });

  it('las categorías llevan al buscador filtrado', () => {
    const enlace = el.querySelector<HTMLAnchorElement>('.in-categoria')!;
    expect(enlace.getAttribute('href')).toMatch(/^\/buscar\?categoria=/);
  });
});


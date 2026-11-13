import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { AuthFacade } from '@features/auth';
import { AlumnoLayoutComponent } from './alumno-layout.component';
import { provideCatalogoMock } from '@features/catalogo/data/mock/catalogo-mock.providers';
import { provideOrdenesMock } from '@features/ordenes/data/mock/ordenes-mock.providers';
import { provideFavoritosMock, providePerfilMock } from '@features/alumno/data/mock/alumno-mock.providers';

/** CL-Sprint5 11/11/2026: navegación del alumno, menú de usuario, cerrar sesión y carrito. */
describe('AlumnoLayoutComponent', () => {
  let fixture: ComponentFixture<AlumnoLayoutComponent>;
  let el: HTMLElement;
  const auth = {
    user: signal({ id: 'u1', email: 'juan.perez@uttt.edu.mx', role: 'Alumno', name: 'Juan Pérez' }),
    logout: vi.fn(),
    loadCurrentUser: vi.fn(() => of(null)),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [AlumnoLayoutComponent],
      providers: [
        provideRouter([]),
        provideOrdenesMock(),
        provideCatalogoMock(),
        provideFavoritosMock(),
        providePerfilMock(),
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
        { provide: AuthFacade, useValue: auth },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AlumnoLayoutComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  // CL-Sprint5 13/11/2026: el nombre viene del back (sesión o perfil), ya no del correo
  it('saluda con el primer nombre que manda el back', () => {
    expect(el.querySelector('.al-saludo strong')!.textContent!.trim()).toBe('Juan');
  });

  it('muestra las 5 secciones y la insignia de pedidos en curso', () => {
    const textos = [...el.querySelectorAll('.al-nav-texto')].map((n) => n.textContent!.trim());
    expect(textos.map((t) => t.split('(')[0].trim())).toEqual([
      'Inicio',
      'Buscar',
      'Pedidos',
      'Favoritos',
      'Perfil',
    ]);
    // Del mock: la 0042 (en preparación) y la 0041 (lista) de Juan siguen en curso
    expect(el.querySelector('.al-nav .al-insignia')!.textContent!.trim()).toBe('2');
  });

  it('cerrar sesión pide confirmación antes de salir', async () => {
    el.querySelector<HTMLButtonElement>('.al-usuario')!.click();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('.al-menu-salir')!.click();
    await fixture.whenStable();

    expect(auth.logout).not.toHaveBeenCalled();
    expect(el.querySelector('app-modal')).not.toBeNull();

    el.querySelector<HTMLButtonElement>('app-modal .cb-btn--primary')!.click();
    expect(auth.logout).toHaveBeenCalledTimes(1);
  });

  it('el botón de la barra abre el carrito', async () => {
    el.querySelector<HTMLButtonElement>('.al-carrito')!.click();
    await fixture.whenStable();
    expect(el.querySelector('app-carrito-drawer .cd')).not.toBeNull();
  });
});

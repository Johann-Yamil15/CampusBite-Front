import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA } from '@core/mock/demo-db';
import { provideCatalogo } from '@features/catalogo';
import { provideFavoritos } from '@features/alumno/alumno.providers';
import { TiendaPage } from './tienda.page';

/** CL-Sprint5 11/11/2026: tienda con el catálogo mock (sin latencia). */
describe('TiendaPage', () => {

  // CL-Sprint5 11/11/2026 (etapa 9): el abierto/cerrado sale del horario del negocio; se fija el reloj en un
  // miércoles a mediodía para que la prueba no dependa de la hora en que corre.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0));
  });
  afterEach(() => vi.useRealTimers());
  let fixture: ComponentFixture<TiendaPage>;
  let el: HTMLElement;

  async function abrir(id: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [TiendaPage],
      providers: [
        provideRouter([]),
        provideCatalogo(),
        provideFavoritos(),
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TiendaPage);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();
  }

  it('muestra la cafetería con su menú agrupado y la sección de promociones', async () => {
    await abrir(DEMO_CAFETERIA.central);
    expect(el.querySelector('h1')!.textContent).toContain('Cafetería Central');
    const secciones = [...el.querySelectorAll('.ti-seccion h2')].map((h) => h.textContent!.trim());
    expect(secciones).toEqual(['Promociones', 'Comidas']);
    expect(el.querySelectorAll('app-platillo-card').length).toBe(3);
  });

  it('el chip de una categoría deja solo esa sección', async () => {
    await abrir(DEMO_CAFETERIA.central);
    const chip = [...el.querySelectorAll<HTMLButtonElement>('.cb-chip')].find(
      (b) => b.textContent!.trim() === 'Comidas',
    )!;
    chip.click();
    await fixture.whenStable();

    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelectorAll('.ti-seccion').length).toBe(1);
  });

  it('avisa cuando la cafetería está cerrada y no deja agregar', async () => {
    await abrir(DEMO_CAFETERIA.express);
    expect(el.querySelector('.ti-cerrada')).not.toBeNull();
    expect(el.querySelector('.pc-agregar')).toBeNull();
  });

  it('un id que no existe muestra "No encontramos esta cafetería"', async () => {
    await abrir('00000000-0000-0000-0000-000000000000');
    expect(el.textContent).toContain('No encontramos esta cafetería');
  });
});

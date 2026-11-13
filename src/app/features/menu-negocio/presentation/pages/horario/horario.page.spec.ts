import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA } from '@features/catalogo/data/mock/catalogo.mock-data';
import { HorarioPage } from './horario.page';
import { provideNegocioMock } from '@features/menu-negocio/data/mock/negocio-mock.providers';

// CL-Sprint5 13/11/2026: ya no se comprueba aquí lo que ve el alumno: lo calcula el back (GET api/menu y
// api/promociones/activas). El mock del negocio ya no comparte datos con el del catálogo.
/** CL-Sprint5 11/11/2026 (etapa 9): el horario se guarda y se cierra por hoy. */
describe('HorarioPage', () => {
  let fixture: ComponentFixture<HorarioPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, 12, 0)); // miércoles
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HorarioPage],
      providers: [
        provideNegocioMock(),
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [{ data: { id: DEMO_CAFETERIA.central } }] } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HorarioPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  const boton = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;

  it('muestra la semana, el día de hoy y que está abierto ahora', () => {
    expect(el.querySelectorAll('.dia').length).toBe(7);
    expect(el.querySelector('.dia.hoy')!.textContent).toContain('Miércoles');
    expect(el.querySelector('.cierre h2')!.textContent).toContain('Abierto ahora');
  });

  it('editar un día valida el rango y guarda la nueva hora', async () => {
    boton('Editar Miércoles').click();
    await fixture.whenStable();
    const [abre, cierra] = [...el.querySelectorAll<HTMLInputElement>('app-modal input[type="time"]')];
    cierra.value = '06:00';
    cierra.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(el.querySelector('app-modal')!.textContent).toContain('tiene que ser después');
    expect(boton('Guardar').disabled).toBe(true);

    abre.value = '08:00';
    abre.dispatchEvent(new Event('input'));
    cierra.value = '20:00';
    cierra.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    boton('Guardar').click();
    await fixture.whenStable();
    expect(el.querySelector('.dia.hoy')!.textContent).toContain('08:00 – 20:00');
  });

  it('"Cerrar por hoy" pide confirmación y se puede volver a abrir', async () => {
    boton('Cerrar por hoy').click();
    await fixture.whenStable();
    boton('Sí, cerrar hoy').click();
    await fixture.whenStable();
    expect(el.querySelector('.cierre h2')!.textContent).toContain('Cerrado por hoy');

    boton('Volver a abrir').click();
    await fixture.whenStable();
    expect(el.querySelector('.cierre h2')!.textContent).toContain('Abierto ahora');
  });
});

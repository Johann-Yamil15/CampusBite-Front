import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA } from '@features/catalogo/data/mock/catalogo.mock-data';
import { PromocionesPage } from './promociones.page';
import { provideNegocioMock } from '@features/menu-negocio/data/mock/negocio-mock.providers';

// CL-Sprint5 13/11/2026: ya no se comprueba aquí lo que ve el alumno: lo calcula el back (GET api/menu y
// api/promociones/activas). El mock del negocio ya no comparte datos con el del catálogo.
/** CL-Sprint5 11/11/2026 (etapa 9): CRUD de promociones con su vigencia. */
describe('PromocionesPage', () => {
  let fixture: ComponentFixture<PromocionesPage>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [PromocionesPage],
      providers: [
        provideNegocioMock(),
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [{ data: { id: DEMO_CAFETERIA.central } }] } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PromocionesPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  const boton = (raiz: ParentNode, texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const escribir = async (nombre: string, valor: string) => {
    const campo = el.querySelector<HTMLInputElement>(`app-modal [name="${nombre}"]`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };
  const enviar = async () => {
    el.querySelector('#form-promo')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  it('muestra las promociones con su vigencia', () => {
    expect(el.querySelectorAll('.promo').length).toBe(3);
    expect(el.textContent).toContain('Visible para alumnos');
    expect(el.textContent).toContain('En pausa');
  });

  it('valida y crea una promoción', async () => {
    boton(el, 'Nueva promoción').click();
    await fixture.whenStable();
    await escribir('nombre', 'Té');
    await escribir('valor', '95');
    await enviar();
    const modal = el.querySelector('app-modal')!.textContent!;
    expect(modal).toContain('al menos 3 letras');
    expect(modal).toContain('de 1 a 90');

    await escribir('nombre', 'Jueves de té');
    await escribir('valor', '15');
    await enviar();
    expect(el.querySelector('app-modal')).toBeNull();
    expect(el.querySelectorAll('.promo').length).toBe(4);
    expect(el.textContent).toContain('Jueves de té');
  });

  it('pausar la deja en pausa y eliminar pide confirmación', async () => {
    const combo = () => [...el.querySelectorAll<HTMLElement>('.promo')].find((p) => p.textContent!.includes('Combo Estudiantil'))!;
    boton(combo(), 'Pausar').click();
    await fixture.whenStable();
    expect(combo().textContent).toContain('En pausa');

    boton(combo(), 'Eliminar').click();
    await fixture.whenStable();
    boton(el.querySelector('app-modal')!, 'Sí, eliminar').click();
    await fixture.whenStable();
    expect(el.querySelectorAll('.promo').length).toBe(2);
  });
});

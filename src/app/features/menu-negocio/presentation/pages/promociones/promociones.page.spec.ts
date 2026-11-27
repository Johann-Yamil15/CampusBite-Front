import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA } from '@features/catalogo/data/mock/catalogo.mock-data';
import { vi } from 'vitest';
import { BorradoresService } from '@core/services/borradores.service';
import { ConexionService } from '@core/services/conexion.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { NegocioFacade } from '@features/menu-negocio/application/negocio.facade';
import { BORRADOR_PROMOCION, PromocionesPage, esBorradorPromocion } from './promociones.page';
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

/** CL-Sprint5 26/11/2026: borrador de la promoción en edición y envío sin internet (patrón de Configuración). */
describe('PromocionesPage (borrador y sin conexión)', () => {
  const jwt = () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'none' })}.${b64({ sub: 'enc', role: 'AdminCafeteria', exp: 4102444800 })}.`;
  };
  const evento = (tipo: 'online' | 'offline') => window.dispatchEvent(new Event(tipo));

  let fixture: ComponentFixture<PromocionesPage>;
  let el: HTMLElement;

  const borrador = () => TestBed.inject(BorradoresService).leer(BORRADOR_PROMOCION, esBorradorPromocion);
  const boton = (raiz: ParentNode, texto: string) =>
    [...raiz.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const guardar = () => el.querySelector<HTMLButtonElement>('app-modal button[type="submit"]')!;
  const refrescar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const escribir = async (nombre: string, valor: string) => {
    const campo = el.querySelector<HTMLInputElement>(`app-modal [name="${nombre}"]`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
    await refrescar();
  };
  const enviar = async () => {
    el.querySelector('#form-promo')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await refrescar();
  };
  /** Entra a la página (como tras recargar). */
  const entrar = async () => {
    fixture = TestBed.createComponent(PromocionesPage);
    el = fixture.nativeElement;
    await refrescar();
  };
  const nuevaConNombre = async (nombre: string) => {
    boton(el, 'Nueva promoción').click();
    await refrescar();
    await escribir('nombre', nombre);
    await escribir('valor', '15');
  };

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
    TestBed.inject(TokenStorageService).set(jwt());
    TestBed.inject(ConexionService); // en la app ya existe desde el arranque
    await entrar();
  });

  afterEach(() => {
    evento('online');
    localStorage.clear();
  });

  it('la promoción a medias se reabre al recargar con lo que llevaba', async () => {
    await nuevaConNombre('Jueves de té');
    expect(borrador()?.nombre).toBe('Jueves de té');

    fixture.destroy();
    await entrar();
    expect(el.querySelector('app-modal')).not.toBeNull();
    expect(el.querySelector<HTMLInputElement>('app-modal [name="nombre"]')!.value).toBe('Jueves de té');
    expect(el.querySelector('.cb-borrador')!.textContent).toContain('Recuperamos cambios sin guardar');
  });

  it('sin internet no envía; al volver habilita «Reintentar», guarda y borra el borrador', async () => {
    const guardarPromocion = vi.spyOn(TestBed.inject(NegocioFacade), 'guardarPromocion');
    await nuevaConNombre('Jueves de té');
    evento('offline');
    await enviar();
    expect(guardarPromocion).not.toHaveBeenCalled();
    expect(el.querySelector('app-modal .cb-alert-error')!.textContent).toContain('Sin conexión');
    expect(guardar().textContent).toContain('Reintentar');
    expect(guardar().disabled).toBe(true);
    expect(borrador()?.nombre).toBe('Jueves de té');

    evento('online');
    await refrescar();
    expect(guardar().disabled).toBe(false);
    expect(guardarPromocion).not.toHaveBeenCalled(); // nunca se reenvía solo
    await enviar();
    expect(guardarPromocion).toHaveBeenCalledTimes(1);
    expect(el.querySelector('app-modal')).toBeNull();
    expect(el.textContent).toContain('Jueves de té');
    expect(borrador()).toBeNull();
  });

  it('"Descartar" en la nota cierra el formulario y olvida el borrador', async () => {
    await nuevaConNombre('Jueves de té');
    fixture.destroy();
    await entrar();
    (el.querySelector('.cb-borrador .cb-link') as HTMLButtonElement).click();
    await refrescar();
    expect(el.querySelector('app-modal')).toBeNull();
    expect(borrador()).toBeNull();
  });

  it('"Cancelar" descarta el borrador', async () => {
    await nuevaConNombre('Jueves de té');
    boton(el.querySelector('app-modal')!, 'Cancelar').click();
    await refrescar();
    expect(el.querySelector('app-modal')).toBeNull();
    expect(borrador()).toBeNull();
  });
});

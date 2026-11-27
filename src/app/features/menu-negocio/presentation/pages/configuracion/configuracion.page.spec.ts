import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Cafeteria, CafeteriaData, CafeteriaFacade } from '@features/cafeterias';
import { BorradoresService } from '@core/services/borradores.service';
import { ConexionService } from '@core/services/conexion.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { BORRADOR_CONFIGURACION, ConfiguracionPage, esBorradorConfiguracion } from './configuracion.page';

const CAFETERIA: Cafeteria = {
  id: 'c1',
  name: 'Cafetería Central',
  location: 'Edificio A',
  onCampus: true,
  pickupPoint: 'Barra principal',
  active: true,
  paymentMethods: ['Tarjeta', 'Efectivo'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** CL-Sprint5 11/11/2026 (etapa 9): Configuración guarda con CafeteriaFacade.update (endpoint real). */
describe('ConfiguracionPage', () => {
  let fixture: ComponentFixture<ConfiguracionPage>;
  let el: HTMLElement;
  let facade: {
    selected: ReturnType<typeof signal<Cafeteria | null>>;
    loadById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    facade = {
      selected: signal<Cafeteria | null>(CAFETERIA),
      loadById: vi.fn(() => of(CAFETERIA)),
      update: vi.fn((_id: string, d: CafeteriaData) => {
        const nueva = { ...CAFETERIA, ...d };
        facade.selected.set(nueva);
        return of(nueva);
      }),
    };
    await TestBed.configureTestingModule({
      imports: [ConfiguracionPage],
      providers: [
        { provide: CafeteriaFacade, useValue: facade },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [{ data: { id: 'c1' } }] } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfiguracionPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  const boton = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const enviar = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  it('parte de los datos guardados y no deja guardar sin cambios', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')!.value).toBe('Cafetería Central');
    expect(boton('Tarjeta').getAttribute('aria-pressed')).toBe('true');
    expect(boton('Transferencia').getAttribute('aria-pressed')).toBe('false');
    expect(boton('Guardar cambios').disabled).toBe(true);
  });

  it('valida: al menos un método de pago y nombre de 2 a 100 caracteres', async () => {
    boton('Tarjeta').click();
    boton('Efectivo').click();
    const nombre = el.querySelector<HTMLInputElement>('input[name="name"]')!;
    nombre.value = 'A';
    nombre.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    await enviar();
    expect(el.textContent).toContain('Acepta al menos un método de pago.');
    expect(el.textContent).toContain('entre 2 y 100 caracteres');
    expect(facade.update).not.toHaveBeenCalled();
  });

  it('guarda los métodos de pago con update', async () => {
    boton('Transferencia').click();
    await fixture.whenStable();
    await enviar();
    expect(facade.update).toHaveBeenCalledWith('c1', expect.objectContaining({
      paymentMethods: ['Tarjeta', 'Transferencia', 'Efectivo'],
    }));
    expect(boton('Guardar cambios').disabled).toBe(true);
  });

  it('si el nombre ya existe (409) lo explica', async () => {
    facade.update.mockReturnValueOnce(throwError(() => ({ status: 409, message: 'Conflicto' })));
    boton('Transferencia').click();
    await fixture.whenStable();
    await enviar();
    expect(el.querySelector('.cb-alert-error')!.textContent).toContain('Ya existe otro negocio con ese nombre');
  });
});

/** CL-Sprint5 26/11/2026: borrador de Configuración y envío sin internet. */
describe('ConfiguracionPage (sin conexión)', () => {
  const jwt = () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'none' })}.${b64({ sub: 'enc', role: 'AdminCafeteria', exp: 4102444800 })}.`;
  };
  const evento = (tipo: 'online' | 'offline') => window.dispatchEvent(new Event(tipo));
  const NOMBRE = `${BORRADOR_CONFIGURACION}.c1`;
  const editado: CafeteriaData = {
    name: 'Cafetería Central Renovada',
    location: 'Edificio A',
    onCampus: true,
    pickupPoint: 'Barra principal',
    paymentMethods: ['Tarjeta', 'Efectivo'],
  };

  let fixture: ComponentFixture<ConfiguracionPage>;
  let el: HTMLElement;
  let facade: {
    selected: ReturnType<typeof signal<Cafeteria | null>>;
    loadById: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  const borrador = () => TestBed.inject(BorradoresService).leer(NOMBRE, esBorradorConfiguracion);
  const refrescar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const guardar = () =>
    [...el.querySelectorAll<HTMLButtonElement>('button[type="submit"]')].find(Boolean)!;

  beforeEach(async () => {
    localStorage.clear();
    facade = {
      selected: signal<Cafeteria | null>(null),
      // Sin internet: la carga falla con status 0
      loadById: vi.fn(() => throwError(() => ({ status: 0, message: 'Sin conexión a internet.' }))),
      update: vi.fn((_id: string, d: CafeteriaData) => of({ ...CAFETERIA, ...d })),
    };
    await TestBed.configureTestingModule({
      imports: [ConfiguracionPage],
      providers: [
        { provide: CafeteriaFacade, useValue: facade },
        { provide: ActivatedRoute, useValue: { snapshot: { pathFromRoot: [{ data: { id: 'c1' } }] } } },
      ],
    }).compileComponents();
    TestBed.inject(TokenStorageService).set(jwt());
    TestBed.inject(BorradoresService).guardar(NOMBRE, editado);
    TestBed.inject(ConexionService); // en la app ya existe desde el arranque
    evento('offline');
    fixture = TestBed.createComponent(ConfiguracionPage);
    el = fixture.nativeElement;
    await refrescar();
  });

  afterEach(() => {
    evento('online');
    localStorage.clear();
  });

  it('sin internet arma el formulario con el borrador y avisa que lo recuperó', () => {
    expect(el.querySelector<HTMLInputElement>('input')!.value).toBe('Cafetería Central Renovada');
    expect(el.querySelector('.cb-borrador')!.textContent).toContain('Recuperamos cambios sin guardar');
  });

  it('no envía sin internet; al volver recarga los datos, conserva el borrador y al guardar lo borra', async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await refrescar();
    expect(facade.update).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Sin conexión');
    expect(guardar().textContent).toContain('Reintentar');
    expect(guardar().disabled).toBe(true);

    // Vuelve el internet: se recargan los datos del negocio
    facade.loadById.mockImplementation(() => {
      facade.selected.set(CAFETERIA);
      return of(CAFETERIA);
    });
    evento('online');
    await refrescar();
    expect(facade.loadById).toHaveBeenCalledTimes(2);
    expect(el.querySelector<HTMLInputElement>('input')!.value).toBe('Cafetería Central Renovada');
    expect(guardar().disabled).toBe(false);

    el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await refrescar();
    expect(facade.update).toHaveBeenCalledWith('c1', editado);
    expect(borrador()).toBeNull();
  });

  it('"Descartar" olvida el borrador', async () => {
    (el.querySelector('.cb-borrador .cb-link') as HTMLButtonElement).click();
    await refrescar();
    expect(borrador()).toBeNull();
    expect(el.querySelector('.cb-borrador')).toBeNull();
  });
});

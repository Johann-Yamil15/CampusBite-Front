import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Cafeteria, CafeteriaFacade } from '@features/cafeterias';
import { CafeteriaFormComponent } from './cafeteria-form.component';

// JJ-Sprint3 21/10/2026: pruebas del formulario conectado al CafeteriaFacade (HU-06A + HU-06B)
const cafe: Cafeteria = {
  id: 'c-1',
  name: 'Cafetería Central',
  location: 'Edificio D',
  onCampus: true,
  pickupPoint: 'Mostrador',
  active: true,
  paymentMethods: ['Tarjeta', 'Efectivo'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

function fakeFacade() {
  return {
    loading: signal(false),
    error: signal<string | null>(null),
    clearError: vi.fn(),
    create: vi.fn(() => of(cafe)),
    update: vi.fn(() => of(cafe)),
  };
}

describe('CafeteriaFormComponent', () => {
  let fixture: ComponentFixture<CafeteriaFormComponent>;
  let facade: ReturnType<typeof fakeFacade>;
  let el: HTMLElement;

  const type = (id: string, value: string) => {
    const input = el.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const toggle = (id: string) => el.querySelector<HTMLInputElement>(`#${id}`)!.click();
  const submit = async () => {
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    facade = fakeFacade();
    await TestBed.configureTestingModule({
      imports: [CafeteriaFormComponent],
      providers: [{ provide: CafeteriaFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(CafeteriaFormComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('no envía y muestra el resumen de errores si faltan datos o métodos de pago', async () => {
    toggle('cafeteria-pay-Efectivo'); // viene marcado por defecto: lo desmarca
    await submit();

    expect(facade.create).not.toHaveBeenCalled();
    const summary = el.querySelector('.error-summary');
    expect(summary?.textContent).toContain('El nombre es obligatorio.');
    expect(summary?.textContent).toContain('Elige al menos un método de pago.');
    expect(el.querySelector('#cafeteria-name')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('crea la cafetería con los datos del backend (recortados) y emite saved', async () => {
    const saved = vi.fn();
    fixture.componentInstance.saved.subscribe(saved);

    type('cafeteria-name', '  Cafetería Central  ');
    type('cafeteria-location', 'Edificio D');
    type('cafeteria-pickup', 'Mostrador');
    toggle('cafeteria-pay-Tarjeta');
    await submit();

    expect(facade.create).toHaveBeenCalledWith({
      name: 'Cafetería Central',
      location: 'Edificio D',
      onCampus: true,
      pickupPoint: 'Mostrador',
      paymentMethods: ['Tarjeta', 'Efectivo'],
    });
    expect(saved).toHaveBeenCalledWith(cafe);
  });

  it('en edición llena el formulario y llama update con el id', async () => {
    fixture.componentRef.setInput('cafeteria', cafe);
    await fixture.whenStable();

    expect(el.querySelector<HTMLInputElement>('#cafeteria-name')!.value).toBe('Cafetería Central');
    expect(el.querySelector<HTMLInputElement>('#cafeteria-pay-Transferencia')!.checked).toBe(false);
    expect(el.querySelector('h2')?.textContent).toContain('Editar cafetería');

    type('cafeteria-pickup', 'Puerta 2');
    await submit();

    expect(facade.update).toHaveBeenCalledWith('c-1', expect.objectContaining({ pickupPoint: 'Puerta 2' }));
    expect(facade.create).not.toHaveBeenCalled();
  });

  it('muestra el error del backend (p. ej. 409 nombre repetido)', async () => {
    facade.error.set('Ya existe un registro con esos datos.');
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Ya existe un registro con esos datos.');
  });
});

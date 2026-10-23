import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Cafeteria, CafeteriaFacade } from '@features/cafeterias';
import { AdminPanelPage } from './admin-panel.page';

// JJ-Sprint3 21/10/2026: pruebas del panel (lista, filtro de bajas y confirmación de baja lógica)
const cafe = (id: string, name: string, active = true): Cafeteria => ({
  id,
  name,
  location: 'Edificio A',
  onCampus: true,
  pickupPoint: 'Puerta 1',
  active,
  paymentMethods: ['Efectivo'],
  createdAt: new Date(),
  updatedAt: new Date(),
});

function fakeFacade(list: Cafeteria[]) {
  return {
    list: signal(list),
    loading: signal(false),
    error: signal<string | null>(null),
    clearError: vi.fn(),
    load: vi.fn(() => of(list)),
    deactivate: vi.fn(() => of(undefined)),
    reactivate: vi.fn(() => of(undefined)),
  };
}

describe('AdminPanelPage', () => {
  let fixture: ComponentFixture<AdminPanelPage>;
  let facade: ReturnType<typeof fakeFacade>;
  let el: HTMLElement;

  const rows = () => Array.from(el.querySelectorAll('tbody tr'));
  const button = (text: string, root: ParentNode = el) =>
    Array.from(root.querySelectorAll('button')).find((b) => b.textContent?.includes(text))!;

  beforeAll(() => {
    // jsdom no implementa <dialog>.showModal()/close()
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
      this.open = true;
    };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
      this.open = false;
    };
  });

  beforeEach(async () => {
    facade = fakeFacade([cafe('a', 'Alfa'), cafe('b', 'Beta', false)]);
    await TestBed.configureTestingModule({
      imports: [AdminPanelPage],
      providers: [{ provide: CafeteriaFacade, useValue: facade }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPanelPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('carga las cafeterías incluyendo las dadas de baja', () => {
    expect(facade.load).toHaveBeenCalledWith({ includeInactive: true });
    expect(rows().length).toBe(2);
    expect(el.textContent).toContain('1 activas de 2');
    expect(rows()[1].textContent).toContain('Dada de baja');
  });

  it('oculta las dadas de baja al desmarcar el filtro', async () => {
    el.querySelector<HTMLInputElement>('.toggle input')!.click();
    await fixture.whenStable();
    expect(rows().length).toBe(1);
    expect(rows()[0].textContent).toContain('Alfa');
  });

  it('pide confirmación antes de dar de baja y luego llama deactivate', async () => {
    button('Dar de baja', rows()[0]).click();
    await fixture.whenStable();
    expect(facade.deactivate).not.toHaveBeenCalled();

    const dialog = el.querySelector('dialog')!;
    expect(dialog.textContent).toContain('Alfa');
    button('Dar de baja', dialog).click();
    await fixture.whenStable();

    expect(facade.deactivate).toHaveBeenCalledWith('a');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('«Alfa» quedó dada de baja.');
  });

  it('reactiva una cafetería dada de baja', async () => {
    button('Reactivar', rows()[1]).click();
    await fixture.whenStable();
    expect(facade.reactivate).toHaveBeenCalledWith('b');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CantidadComponent } from './cantidad.component';

/** CL-Sprint5 11/11/2026: límites del selector y el "quitar" en el mínimo. */
describe('CantidadComponent', () => {
  let fixture: ComponentFixture<CantidadComponent>;
  let el: HTMLElement;

  const botones = () => el.querySelectorAll<HTMLButtonElement>('button.paso');
  const valor = () => el.querySelector('.valor')!.textContent!.trim();

  async function crear(entradas: Record<string, unknown>): Promise<void> {
    await TestBed.configureTestingModule({ imports: [CantidadComponent] }).compileComponents();
    fixture = TestBed.createComponent(CantidadComponent);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('etiqueta', 'Latte');
    for (const [k, v] of Object.entries(entradas)) fixture.componentRef.setInput(k, v);
    await fixture.whenStable();
  }

  it('sube y baja dentro de los límites', async () => {
    await crear({ valor: 2, max: 3 });
    botones()[1].click();
    await fixture.whenStable();
    expect(valor()).toBe('3');
    expect(botones()[1].disabled).toBe(true);

    botones()[0].click();
    botones()[0].click();
    await fixture.whenStable();
    expect(valor()).toBe('1');
    // Sin `quitable`, en el mínimo no se puede bajar más
    expect(botones()[0].disabled).toBe(true);
  });

  it('con quitable, en el mínimo emite quitar en vez de bajar', async () => {
    await crear({ valor: 1, quitable: true });
    let quitado = false;
    fixture.componentInstance.quitar.subscribe(() => (quitado = true));

    expect(botones()[0].getAttribute('aria-label')).toBe('Quitar Latte');
    botones()[0].click();
    await fixture.whenStable();

    expect(quitado).toBe(true);
    expect(valor()).toBe('1');
  });
});

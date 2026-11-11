import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { MisPedidosFacade, provideOrdenes } from '@features/ordenes';
import { ReportarProblemaComponent } from './reportar-problema.component';

const ENTREGADA = '24110038-0000-4000-8000-000000000000';

/** CL-Sprint5 11/11/2026 (etapa 6): reportar un problema (mock). */
describe('ReportarProblemaComponent', () => {
  let fixture: ComponentFixture<ReportarProblemaComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportarProblemaComponent],
      providers: [provideOrdenes(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    const pedidos = TestBed.inject(MisPedidosFacade);
    await firstValueFrom(pedidos.cargar(true));
    fixture = TestBed.createComponent(ReportarProblemaComponent);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('orden', pedidos.porId(ENTREGADA));
    await fixture.whenStable();
  });

  const motivo = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('.rp-motivo')].find((b) => b.textContent!.includes(texto))!;
  const enviar = () =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes('Enviar reporte'))!;
  const escribir = async (texto: string) => {
    const area = el.querySelector('textarea')!;
    area.value = texto;
    area.dispatchEvent(new Event('input'));
    await fixture.whenStable();
  };

  it('pide motivo y, con "Otro", que cuente qué pasó', async () => {
    expect(enviar().disabled).toBe(true);
    motivo('Otro').click();
    await fixture.whenStable();
    expect(motivo('Otro').getAttribute('aria-checked')).toBe('true');
    await escribir('mal');
    expect(enviar().disabled).toBe(true);
    expect(el.querySelector('.rp-falta')).toBeTruthy();
    await escribir('El vaso venía roto');
    expect(enviar().disabled).toBe(false);
  });

  it('al enviar confirma con el folio del reporte', async () => {
    motivo('Faltó un artículo').click();
    await fixture.whenStable();
    enviar().click();
    await fixture.whenStable();
    expect(el.querySelector('.rp-ok')!.textContent).toMatch(/Recibimos tu reporte R-\d{6}/);
  });
});

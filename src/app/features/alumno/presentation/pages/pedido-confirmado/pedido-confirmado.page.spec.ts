import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@core/mock/demo-db';
import { MetodoPagoOrden, MisPedidosFacade, provideOrdenes } from '@features/ordenes';
import { PedidoConfirmadoPage } from './pedido-confirmado.page';

/** CL-Sprint5 11/11/2026: confirmación con el código de recogida (etapa 5). */
describe('PedidoConfirmadoPage', () => {
  let fixture: ComponentFixture<PedidoConfirmadoPage>;
  let el: HTMLElement;

  async function confirmar(metodo: MetodoPagoOrden): Promise<string> {
    await TestBed.configureTestingModule({
      imports: [PedidoConfirmadoPage],
      providers: [provideRouter([]), provideOrdenes(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    const orden = await firstValueFrom(
      TestBed.inject(MisPedidosFacade).crear({
        idCafeteria: DEMO_CAFETERIA.central,
        recogidaEn: new Date(Date.now() + 30 * 60_000).toISOString(),
        metodo,
        items: [{ idProducto: DEMO_PRODUCTO.sandwich, cantidad: 1 }],
      }),
    );
    fixture = TestBed.createComponent(PedidoConfirmadoPage);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('id', orden.idOrden);
    await fixture.whenStable();
    return orden.codigoRecogida;
  }

  it('muestra los 6 dígitos del código de recogida', async () => {
    const codigo = await confirmar('efectivo');
    const digitos = [...el.querySelectorAll('.cr-digito')].map((d) => d.textContent!.trim()).join('');
    expect(digitos).toBe(codigo);
    expect(el.querySelector('.cr-codigo')!.getAttribute('aria-label')).toBe('Código ' + codigo.split('').join(' '));
  });

  it('dice qué sigue según el método de pago', async () => {
    await confirmar('efectivo');
    expect(el.querySelector('.pc-sigue')!.textContent).toContain('en efectivo al recoger');
  });

  it('con transferencia da los datos y marca que falta el pago', async () => {
    await confirmar('transferencia');
    expect(el.querySelector('.pc-sigue.pendiente')!.textContent).toContain('CLABE');
  });

  it('un id que no existe dice que no lo encontramos', async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoConfirmadoPage],
      providers: [provideRouter([]), provideOrdenes(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    fixture = TestBed.createComponent(PedidoConfirmadoPage);
    el = fixture.nativeElement;
    fixture.componentRef.setInput('id', 'no-existe');
    await fixture.whenStable();
    expect(el.textContent).toContain('No encontramos ese pedido');
  });
});

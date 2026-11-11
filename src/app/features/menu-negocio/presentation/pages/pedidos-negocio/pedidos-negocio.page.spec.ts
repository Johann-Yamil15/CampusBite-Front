import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidosNegocioPage } from './pedidos-negocio.page';

/**
 * JY-Sprint4 05/11/2026: cubre lo único que tiene lógica en el cascarón: cómo avanza un pedido de columna
 * y que rechazar exija motivo. Las cifras vienen de pedidos.mock.ts.
 */
describe('PedidosNegocioPage', () => {
  let fixture: ComponentFixture<PedidosNegocioPage>;
  let el: HTMLElement;

  const textos = (selector: string): string[] =>
    [...el.querySelectorAll(selector)].map((n) => n.textContent!.trim());

  const columna = (indice: number): HTMLElement =>
    el.querySelectorAll<HTMLElement>('.columna')[indice];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PedidosNegocioPage] }).compileComponents();
    fixture = TestBed.createComponent(PedidosNegocioPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('reparte los pedidos en las tres columnas del tablero', () => {
    expect(textos('.columna-head h2')).toEqual([
      'Nuevos',
      'En preparación',
      'Listos para recoger',
    ]);
    // Del mock: 2 nuevos, 2 en preparación, 1 listo
    expect(textos('.columna-num')).toEqual(['2', '2', '1']);
  });

  it('avanzar mueve el pedido a la siguiente columna', async () => {
    const folio = columna(0).querySelector('.orden-folio')!.textContent;

    columna(0).querySelector<HTMLButtonElement>('.orden-acciones .cb-btn--primary')!.click();
    await fixture.whenStable();

    expect(textos('.columna-num')).toEqual(['1', '3', '1']);
    expect(columna(1).textContent).toContain(folio);
  });

  it('entregar saca el pedido del tablero y lo manda a cerrados', async () => {
    // La tercera columna ("Listos") avanza a entregado
    columna(2).querySelector<HTMLButtonElement>('.orden-acciones .cb-btn--primary')!.click();
    await fixture.whenStable();

    expect(textos('.columna-num')).toEqual(['2', '2', '0']);
    // 1 entregado y 1 cancelado del mock, más el que se acaba de entregar
    expect(el.querySelectorAll('.tab')[1].textContent).toContain('3');
  });

  it('rechazar pide un motivo antes de dejar confirmar', async () => {
    columna(0).querySelector<HTMLButtonElement>('.orden-acciones .cb-btn--secondary')!.click();
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('app-modal .cb-btn--danger')!.click();
    await fixture.whenStable();

    const confirmar = el.querySelector<HTMLButtonElement>('app-modal .cb-btn--danger')!;
    expect(confirmar.disabled).toBe(true);

    const motivo = el.querySelector<HTMLTextAreaElement>('app-modal textarea')!;
    motivo.value = 'Se nos acabó el ingrediente';
    motivo.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(el.querySelector<HTMLButtonElement>('app-modal .cb-btn--danger')!.disabled).toBe(false);
  });

  it('un pedido rechazado sale del tablero', async () => {
    columna(0).querySelector<HTMLButtonElement>('.orden-acciones .cb-btn--secondary')!.click();
    await fixture.whenStable();
    el.querySelector<HTMLButtonElement>('app-modal .cb-btn--danger')!.click();
    await fixture.whenStable();

    const motivo = el.querySelector<HTMLTextAreaElement>('app-modal textarea')!;
    motivo.value = 'Ya cerramos';
    motivo.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    el.querySelector<HTMLButtonElement>('app-modal .cb-btn--danger')!.click();
    await fixture.whenStable();

    expect(textos('.columna-num')).toEqual(['1', '2', '1']);
    // El aviso lo muestra el toast global (app-toast-host), que vive en la raíz y no en esta pantalla
  });
});

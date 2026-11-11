// FB-Sprint4 01/11/2026: Pruebas del modal de confirmación (recogida mínima, payload, éxito y error).
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ConfirmarOrdenComponent, ConfirmarOrdenData, aIsoConOffset } from './confirmar-orden.component';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { MisPedidosFacade } from '@features/ordenes';

// FB-Sprint4 01/11/2026: genera el valor local "YYYY-MM-DDTHH:mm" que produce <input type="datetime-local">
function localEnMinutos(minutos: number): string {
  const d = new Date(Date.now() + minutos * 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

describe('ConfirmarOrdenComponent', () => {
  let component: ConfirmarOrdenComponent;
  let fixture: ComponentFixture<ConfirmarOrdenComponent>;
  let carrito: CarritoStore;

  const dialogRef = { close: vi.fn(), disableClose: false };
  const ordenes   = { crear: vi.fn() };
  const snack     = { open: vi.fn() };

  async function crear(data: ConfirmarOrdenData | null = null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ConfirmarOrdenComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MisPedidosFacade, useValue: ordenes },
        { provide: MatSnackBar, useValue: snack },
      ],
    }).compileComponents();

    carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();
    carrito.agregar({
      idProducto: 'p1', producto: 'Latte Helado', precio: 38, cantidad: 2,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });
    carrito.agregar({
      idProducto: 'p2', producto: 'Croissant de Jamón', precio: 45, cantidad: 1,
      imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Cafetería Central',
    });

    fixture = TestBed.createComponent(ConfirmarOrdenComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    dialogRef.disableClose = false;
  });

  describe('validación de recogidaEn (mínimo now() + 5 min)', () => {
    beforeEach(() => crear());

    it('el valor por defecto es válido', () => {
      expect(component.form.valid).toBe(true);
    });

    it('es inválido si la recogida es en 1 minuto', () => {
      component.form.controls.recogidaEn.setValue(localEnMinutos(1));
      expect(component.form.controls.recogidaEn.hasError('recogidaMinima')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('es inválido si la fecha ya pasó', () => {
      component.form.controls.recogidaEn.setValue(localEnMinutos(-30));
      expect(component.form.controls.recogidaEn.hasError('recogidaMinima')).toBe(true);
    });

    it('es válido a partir de 6 minutos', () => {
      component.form.controls.recogidaEn.setValue(localEnMinutos(6));
      expect(component.form.controls.recogidaEn.valid).toBe(true);
    });

    it('es inválido si está vacío', () => {
      component.form.controls.recogidaEn.setValue('');
      expect(component.form.controls.recogidaEn.hasError('required')).toBe(true);
    });

    it('notas de más de 200 caracteres invalidan el formulario', () => {
      component.form.controls.notas.setValue('x'.repeat(201));
      expect(component.form.controls.notas.hasError('maxlength')).toBe(true);
    });

    it('no envía si el formulario es inválido', () => {
      component.form.controls.recogidaEn.setValue(localEnMinutos(1));
      component.confirmar();
      expect(ordenes.crear).not.toHaveBeenCalled();
      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('revalida al enviar: una hora válida al abrir pero vencida al confirmar no se envía', () => {
      vi.useFakeTimers();
      try {
        component.form.controls.recogidaEn.setValue(localEnMinutos(6));
        vi.advanceTimersByTime(2 * 60_000);
        component.confirmar();
        expect(ordenes.crear).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('envío', () => {
    beforeEach(() => crear());

    it('llama a crear con el payload correcto, muestra el código y cierra devolviendo true', () => {
      ordenes.crear.mockReturnValue(of({ codigoRecogida: '048213' }));
      const recogida = localEnMinutos(30);
      component.form.setValue({ recogidaEn: recogida, metodo: 'tarjeta', notas: '  sin cebolla  ' });

      component.confirmar();

      expect(ordenes.crear).toHaveBeenCalledWith({
        idCafeteria: 'c1',
        recogidaEn: aIsoConOffset(new Date(recogida)),
        metodo: 'tarjeta',
        items: [
          { idProducto: 'p1', cantidad: 2 },
          { idProducto: 'p2', cantidad: 1 },
        ],
        notas: 'sin cebolla',
      });
      expect(snack.open).toHaveBeenCalledWith('¡Pedido realizado! Código: 048213', 'Cerrar', expect.anything());
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    });

    it('recogidaEn lleva offset de zona horaria y representa el mismo instante', () => {
      ordenes.crear.mockReturnValue(of({ codigoRecogida: '000000' }));
      const recogida = localEnMinutos(30);
      component.form.controls.recogidaEn.setValue(recogida);
      component.confirmar();
      const enviada: string = ordenes.crear.mock.calls[0][0].recogidaEn;
      expect(enviada).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
      expect(new Date(enviada).getTime()).toBe(new Date(recogida).getTime());
    });

    it('omite notas cuando están vacías', () => {
      ordenes.crear.mockReturnValue(of({ codigoRecogida: '000000' }));
      component.confirmar();
      expect(ordenes.crear.mock.calls[0][0]).not.toHaveProperty('notas');
    });

    it('si falla muestra snackbar, no cierra y conserva el carrito', () => {
      ordenes.crear.mockReturnValue(throwError(() => ({ status: 500, message: 'Cafetería cerrada' })));

      component.confirmar();

      expect(snack.open).toHaveBeenCalledWith('Cafetería cerrada', 'Cerrar', expect.anything());
      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(carrito.totalItems()).toBe(3);
      expect(component.enviando()).toBe(false);
      expect(dialogRef.disableClose).toBe(false);
    });

    it('cancelar cierra devolviendo false', () => {
      component.cancelar();
      expect(dialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('métodos de pago', () => {
    it('sin data muestra los tres métodos', async () => {
      await crear();
      expect(component.metodos.map(m => m.valor)).toEqual(['efectivo', 'tarjeta', 'transferencia']);
    });

    it('solo muestra los métodos que acepta la cafetería', async () => {
      await crear({ metodosPago: ['transferencia'] });
      expect(component.metodos.map(m => m.valor)).toEqual(['transferencia']);
      expect(component.form.controls.metodo.value).toBe('transferencia');
    });
  });
});

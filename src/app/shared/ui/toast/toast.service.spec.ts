import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TOAST_ACCION_MS, TOAST_MS, ToastService } from './toast.service';

/** CL-Sprint5 11/11/2026 (etapa 7): avisos con acción ("Deshacer"). */
describe('ToastService', () => {
  let toasts: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    toasts = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('sin acción se va a los 5 s', () => {
    toasts.ok('Listo');
    vi.advanceTimersByTime(TOAST_MS);
    expect(toasts.toasts()).toEqual([]);
  });

  it('con acción dura más y al tocarla la ejecuta y se cierra', () => {
    const ejecutar = vi.fn();
    toasts.info('Quitaste algo', { etiqueta: 'Deshacer', ejecutar });
    vi.advanceTimersByTime(TOAST_MS);
    expect(toasts.toasts().length).toBe(1);

    toasts.accionar(toasts.toasts()[0].id);
    expect(ejecutar).toHaveBeenCalledOnce();
    expect(toasts.toasts()).toEqual([]);
    vi.advanceTimersByTime(TOAST_ACCION_MS);
    expect(ejecutar).toHaveBeenCalledOnce();
  });
});

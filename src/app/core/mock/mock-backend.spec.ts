import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS, MockBackend, MockHttpError } from './mock-backend';

describe('MockBackend', () => {
  let backend: MockBackend;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: MOCK_LATENCIA_MS, useValue: 0 }] });
    backend = TestBed.inject(MockBackend);
  });

  it('no ejecuta la acción hasta que alguien se suscribe', () => {
    let llamadas = 0;
    const respuesta = backend.responder(() => ++llamadas);
    expect(llamadas).toBe(0);
    respuesta.subscribe();
    expect(llamadas).toBe(1);
  });

  it('emite el resultado de la acción', async () => {
    await expect(firstValueFrom(backend.responder(() => 42))).resolves.toBe(42);
  });

  it('un MockHttpError llega como ApiError con su status y mensaje', async () => {
    const respuesta = backend.responder(() => {
      throw new MockHttpError(409, 'Ya existe');
    });
    await expect(firstValueFrom(respuesta)).rejects.toEqual({ status: 409, message: 'Ya existe' });
  });

  it('cualquier otro error llega como 500 genérico', async () => {
    const respuesta = backend.responder(() => {
      throw new Error('boom');
    });
    await expect(firstValueFrom(respuesta)).rejects.toMatchObject({ status: 500 });
  });
});

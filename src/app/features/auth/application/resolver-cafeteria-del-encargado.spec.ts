import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { TokenStorageService } from '@core/services/token-storage.service';
import { Cafeteria, CafeteriaFacade } from '@features/cafeterias';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import {
  CAFETERIA_ENCARGADO_KEY,
  resolverCafeteriaDelEncargado,
} from './resolver-cafeteria-del-encargado';

// CL-Sprint4 28/10/2026: HU-07B. TEMPORAL: borrar junto con resolverCafeteriaDelEncargado
describe('resolverCafeteriaDelEncargado', () => {
  const KEY = `${CAFETERIA_ENCARGADO_KEY}u-1`;
  // JWT sin firmar con { "sub": "u-1" }: el resolver solo lee el claim
  const TOKEN = `x.${btoa(JSON.stringify({ sub: 'u-1' }))}.x`;

  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  /** `status` por id: 200 (por defecto) → suya, 403 → de otro negocio, otro → error. */
  function setup(status: Record<string, number> = {}, ids = ['c-a', 'c-b', 'c-c']) {
    const puedeVerProductos = vi.fn((id: string) => {
      const code = status[id] ?? 200;
      return code === 200 || code === 403 ? of(code === 200) : throwError(() => ({ status: code }));
    });
    const load = vi.fn(() => of(ids.map((id) => ({ id }) as Cafeteria)));
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthRepository, useValue: { puedeVerProductos } },
        { provide: CafeteriaFacade, useValue: { load } },
        { provide: TokenStorageService, useValue: { get: () => TOKEN } },
      ],
    });
    const result$ = TestBed.runInInjectionContext(() => resolverCafeteriaDelEncargado());
    return { result$, puedeVerProductos, load };
  }

  it('prueba en orden y se detiene en la primera que responde 200', async () => {
    const { result$, puedeVerProductos } = setup({ 'c-a': 403 });
    expect(await firstValueFrom(result$)).toBe('c-b');
    expect(puedeVerProductos.mock.calls.map(([id]) => id)).toEqual(['c-a', 'c-b']);
  });

  it('guarda el id encontrado para el usuario del token', async () => {
    const { result$ } = setup({ 'c-a': 403 });
    await firstValueFrom(result$);
    expect(localStorage.getItem(KEY)).toBe('c-b');
  });

  it('si ya lo tiene guardado no lista ni prueba nada', async () => {
    localStorage.setItem(KEY, 'c-guardada');
    const { result$, load, puedeVerProductos } = setup();
    expect(await firstValueFrom(result$)).toBe('c-guardada');
    expect(load).not.toHaveBeenCalled();
    expect(puedeVerProductos).not.toHaveBeenCalled();
  });

  it('devuelve null y no guarda nada si ninguna responde 200', async () => {
    const { result$ } = setup({ 'c-a': 403, 'c-b': 403, 'c-c': 403 });
    expect(await firstValueFrom(result$)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('devuelve null si no hay cafeterías activas', async () => {
    const { result$ } = setup({}, []);
    expect(await firstValueFrom(result$)).toBeNull();
  });

  it('falla ante un error distinto de 403 sin seguir probando', async () => {
    const { result$, puedeVerProductos } = setup({ 'c-a': 500 });
    await expect(firstValueFrom(result$)).rejects.toEqual({ status: 500 });
    expect(puedeVerProductos).toHaveBeenCalledOnce();
  });
});

// CL-Sprint5 26/11/2026: pruebas de los borradores por usuario en localStorage.
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BorradoresService, PREFIJO_BORRADOR, VIGENCIA_BORRADOR_MS } from './borradores.service';
import { TokenStorageService } from './token-storage.service';

/** JWT de prueba (sin firma: el front no la valida). */
function jwtDePrueba(sub: string): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${b64({ alg: 'none' })}.${b64({ sub, role: 'Alumno', exp: 4102444800 })}.`;
}

const esTexto = (d: unknown): d is string => typeof d === 'string';

describe('BorradoresService', () => {
  let borradores: BorradoresService;
  let tokens: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    borradores = TestBed.inject(BorradoresService);
    tokens = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('sin sesión no guarda ni lee nada', () => {
    tokens.clear();
    borradores.guardar('notas', 'hola');
    expect(borradores.leer('notas', esTexto)).toBeNull();
    expect(Object.keys(localStorage).some((k) => k.startsWith(PREFIJO_BORRADOR))).toBe(false);
  });

  it('guarda y lee por usuario: otro usuario no ve los del primero', () => {
    tokens.set(jwtDePrueba('ana'));
    borradores.guardar('notas', 'de Ana');
    expect(borradores.leer('notas', esTexto)).toBe('de Ana');

    tokens.set(jwtDePrueba('beto'));
    expect(borradores.leer('notas', esTexto)).toBeNull();

    tokens.set(jwtDePrueba('ana'));
    expect(borradores.leer('notas', esTexto)).toBe('de Ana');
  });

  it('descarta (y borra) lo que no pasa la validación o está roto', () => {
    tokens.set(jwtDePrueba('ana'));
    borradores.guardar('notas', 42);
    expect(borradores.leer('notas', esTexto)).toBeNull();
    expect(localStorage.getItem(`${PREFIJO_BORRADOR}ana.notas`)).toBeNull();

    localStorage.setItem(`${PREFIJO_BORRADOR}ana.otro`, '{no es json');
    expect(borradores.leer('otro', esTexto)).toBeNull();
  });

  it('un borrador vencido ya no se recupera', () => {
    tokens.set(jwtDePrueba('ana'));
    borradores.guardar('notas', 'viejo');
    const ahora = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(ahora + VIGENCIA_BORRADOR_MS + 1);
    expect(borradores.leer('notas', esTexto)).toBeNull();
  });

  it('borrarTodos solo borra los del usuario actual', () => {
    tokens.set(jwtDePrueba('beto'));
    borradores.guardar('carrito', 'de Beto');
    tokens.set(jwtDePrueba('ana'));
    borradores.guardar('carrito', 'de Ana');
    borradores.guardar('checkout', 'de Ana');

    borradores.borrarTodos();
    expect(borradores.leer('carrito', esTexto)).toBeNull();
    expect(borradores.leer('checkout', esTexto)).toBeNull();
    expect(borradores.leer('carrito', esTexto, 'beto')).toBe('de Beto');
  });

  it('si la sesión vence el borrador se conserva para cuando vuelva a entrar', () => {
    tokens.set(jwtDePrueba('ana'));
    borradores.guardar('carrito', 'de Ana');
    tokens.clear(); // vence o 401: no se borra nada
    expect(borradores.usuario()).toBeNull();
    tokens.set(jwtDePrueba('ana'));
    expect(borradores.leer('carrito', esTexto)).toBe('de Ana');
  });

  it('si localStorage falla, no truena', () => {
    tokens.set(jwtDePrueba('ana'));
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => borradores.guardar('notas', 'x')).not.toThrow();
    expect(borradores.leer('notas', esTexto)).toBeNull();
    expect(() => borradores.borrarTodos()).not.toThrow();
  });
});

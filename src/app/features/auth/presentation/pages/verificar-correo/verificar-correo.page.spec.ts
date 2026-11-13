import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { VerificarCorreoPage } from './verificar-correo.page';

/** JJ-Sprint5 13/11/2026: página del enlace de verificación (token válido, inválido, ausente y reenviar). */
describe('VerificarCorreoPage', () => {
  let verificar: Observable<unknown>;
  let reenviar: Observable<void>;
  const facade = {
    error: signal<string | null>(null),
    isLoading: signal(false),
    clearError: () => facade.error.set(null),
    verificarCorreo: () => verificar,
    reenviarVerificacion: () => reenviar,
  };

  function crear(token: string | null) {
    TestBed.configureTestingModule({
      imports: [VerificarCorreoPage],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: facade },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } } },
      ],
    });
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(VerificarCorreoPage);
    fixture.detectChanges();
    return { fixture, navegar, page: fixture.componentInstance as unknown as Record<string, any> };
  }

  beforeEach(() => {
    verificar = of({});
    reenviar = of(undefined);
    facade.error.set(null);
  });

  it('con un token válido inicia sesión y va al inicio', () => {
    const { navegar, page } = crear('abc');
    expect(navegar).toHaveBeenCalledWith('/');
    expect(page['estado']()).toBe('verificando');
  });

  it('sin token falla y lo explica', () => {
    const { page } = crear(null);
    expect(page['estado']()).toBe('fallo');
    expect(page['motivo']()).toContain('no trae el código');
  });

  it('con un token vencido muestra el detail del back', () => {
    // Como el facade real: el mensaje del back se guarda al fallar la petición (después de clearError)
    verificar = throwError(() => {
      facade.error.set('El enlace venció');
      return new Error('x');
    });
    const { page } = crear('viejo');
    expect(page['estado']()).toBe('fallo');
    expect(page['motivo']()).toBe('El enlace venció');
  });

  it('reenviar exige un correo válido y luego confirma', () => {
    verificar = throwError(() => new Error('x'));
    const { page } = crear('viejo');

    page['reenviar']();
    expect(page['form'].touched).toBe(true);
    expect(page['estado']()).toBe('fallo');

    page['form'].setValue({ correo: 'ana@uttt.edu.mx' });
    page['reenviar']();
    expect(page['estado']()).toBe('reenviado');
  });

  it('si el reenvío falla se queda en fallo (el mensaje lo deja el facade)', () => {
    verificar = throwError(() => new Error('x'));
    reenviar = throwError(() => new Error('429'));
    const { page } = crear('viejo');
    page['form'].setValue({ correo: 'ana@uttt.edu.mx' });
    page['reenviar']();
    expect(page['estado']()).toBe('fallo');
  });
});

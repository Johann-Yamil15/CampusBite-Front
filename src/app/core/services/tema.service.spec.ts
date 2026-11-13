import { TestBed } from '@angular/core/testing';
import { CLAVE_TEMA, TemaService } from './tema.service';

/** CL-Sprint5 11/11/2026 (etapa 8): apariencia claro / oscuro / sistema guardada en el navegador. */
describe('TemaService', () => {
  const raiz = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    delete raiz.dataset['theme'];
  });

  afterEach(() => {
    localStorage.clear();
    delete raiz.dataset['theme'];
  });

  it('sin elección sigue al sistema', () => {
    const tema = TestBed.inject(TemaService);
    expect(tema.preferencia()).toBe('sistema');
    expect(raiz.dataset['theme']).toBeUndefined();
  });

  it('oscuro y claro se aplican al <html> y se guardan; "sistema" los quita', () => {
    const tema = TestBed.inject(TemaService);
    tema.elegir('oscuro');
    expect(raiz.dataset['theme']).toBe('dark');
    expect(localStorage.getItem(CLAVE_TEMA)).toBe('oscuro');
    tema.elegir('claro');
    expect(raiz.dataset['theme']).toBe('light');
    tema.elegir('sistema');
    expect(raiz.dataset['theme']).toBeUndefined();
    expect(localStorage.getItem(CLAVE_TEMA)).toBeNull();
  });

  it('al iniciar recupera lo guardado', () => {
    localStorage.setItem(CLAVE_TEMA, 'oscuro');
    expect(TestBed.inject(TemaService).preferencia()).toBe('oscuro');
    expect(raiz.dataset['theme']).toBe('dark');
  });
});

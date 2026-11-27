// CL-Sprint5 26/11/2026: pruebas del estado de conexión (eventos online/offline del navegador).
import { TestBed } from '@angular/core/testing';
import { ConexionService } from './conexion.service';

describe('ConexionService', () => {
  let conexion: ConexionService;
  const evento = (tipo: 'online' | 'offline') => window.dispatchEvent(new Event(tipo));

  beforeEach(() => {
    TestBed.configureTestingModule({});
    conexion = TestBed.inject(ConexionService);
  });

  afterEach(() => evento('online'));

  it('arranca con lo que dice el navegador', () => {
    expect(conexion.enLinea()).toBe(navigator.onLine);
  });

  it('sigue los eventos offline y online', () => {
    evento('offline');
    expect(conexion.enLinea()).toBe(false);
    evento('online');
    expect(conexion.enLinea()).toBe(true);
  });

  it('avisa una sola vez al reconectar, no si ya estaba en línea', () => {
    const avisos: void[] = [];
    conexion.reconectado$.subscribe((a) => avisos.push(a));

    evento('online'); // ya estaba en línea
    expect(avisos.length).toBe(0);

    evento('offline');
    evento('offline');
    evento('online');
    evento('online');
    expect(avisos.length).toBe(1);
  });

  it('deja de escuchar al destruirse', () => {
    TestBed.resetTestingModule();
    evento('offline');
    expect(conexion.enLinea()).toBe(true);
  });
});

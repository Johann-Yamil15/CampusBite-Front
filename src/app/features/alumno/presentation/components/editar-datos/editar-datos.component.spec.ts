// CL-Sprint5 26/11/2026: borrador de "Editar mis datos" y envío sin internet (mismo patrón que Configuración).
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { BorradoresService } from '@core/services/borradores.service';
import { ConexionService } from '@core/services/conexion.service';
import { TokenStorageService } from '@core/services/token-storage.service';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import { BORRADOR_PERFIL, EditarDatosComponent, esBorradorPerfil } from './editar-datos.component';

describe('EditarDatosComponent (borrador y sin conexión)', () => {
  const jwt = () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${b64({ alg: 'none' })}.${b64({ sub: 'ana', role: 'Alumno', exp: 4102444800 })}.`;
  };
  const evento = (tipo: 'online' | 'offline') => window.dispatchEvent(new Event(tipo));

  let fixture: ComponentFixture<EditarDatosComponent>;
  let el: HTMLElement;
  let perfil: { perfil: ReturnType<typeof signal>; nombre: ReturnType<typeof signal>; guardarDatos: ReturnType<typeof vi.fn> };

  const borrador = () => TestBed.inject(BorradoresService).leer(BORRADOR_PERFIL, esBorradorPerfil);
  const campo = (nombre: string) => el.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
  const guardar = () => el.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const refrescar = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const escribir = async (nombre: string, valor: string) => {
    campo(nombre).value = valor;
    campo(nombre).dispatchEvent(new Event('input'));
    await refrescar();
  };
  const enviar = async () => {
    el.querySelector('#form-datos')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await refrescar();
  };
  /** Abre el diálogo de nuevo (como tras recargar la página: no pasa por "Cancelar"). */
  const abrir = async () => {
    fixture = TestBed.createComponent(EditarDatosComponent);
    el = fixture.nativeElement;
    await refrescar();
  };

  beforeEach(async () => {
    localStorage.clear();
    perfil = {
      perfil: signal({ datos: { nombre: 'Ana López', matricula: '2024001', telefono: '4421234567' } }),
      nombre: signal('Ana'),
      guardarDatos: vi.fn(() => of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [EditarDatosComponent],
      providers: [{ provide: PerfilFacade, useValue: perfil }],
    }).compileComponents();
    TestBed.inject(TokenStorageService).set(jwt());
    TestBed.inject(ConexionService); // en la app ya existe desde el arranque
    await abrir();
  });

  afterEach(() => {
    evento('online');
    localStorage.clear();
  });

  it('arranca con lo guardado y sin nota de borrador', () => {
    expect(campo('nombre').value).toBe('Ana López');
    expect(el.querySelector('.cb-borrador')).toBeNull();
  });

  it('lo que escribe se recupera al volver a abrir (p. ej. tras recargar)', async () => {
    await escribir('nombre', 'Ana María López');
    expect(borrador()?.nombre).toBe('Ana María López');

    fixture.destroy();
    await abrir();
    expect(campo('nombre').value).toBe('Ana María López');
    expect(campo('telefono').value).toBe('4421234567');
    expect(el.querySelector('.cb-borrador')!.textContent).toContain('Recuperamos cambios sin guardar');
  });

  it('sin internet no envía; al volver habilita «Reintentar», guarda y borra el borrador', async () => {
    await escribir('nombre', 'Ana María López');
    evento('offline');
    await enviar();
    expect(perfil.guardarDatos).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Sin conexión');
    expect(guardar().textContent).toContain('Reintentar');
    expect(guardar().disabled).toBe(true);
    expect(borrador()?.nombre).toBe('Ana María López');

    evento('online');
    await refrescar();
    expect(guardar().disabled).toBe(false);
    expect(perfil.guardarDatos).not.toHaveBeenCalled(); // nunca se reenvía solo
    await enviar();
    expect(perfil.guardarDatos).toHaveBeenCalledWith({ nombre: 'Ana María López', matricula: '2024001', telefono: '4421234567' });
    expect(borrador()).toBeNull();
  });

  it('"Descartar" vuelve a lo guardado y olvida el borrador', async () => {
    await escribir('nombre', 'Otro nombre');
    fixture.destroy();
    await abrir();
    (el.querySelector('.cb-borrador .cb-link') as HTMLButtonElement).click();
    await refrescar();
    expect(campo('nombre').value).toBe('Ana López');
    expect(borrador()).toBeNull();
    expect(el.querySelector('.cb-borrador')).toBeNull();
  });

  it('"Cancelar" descarta el borrador', async () => {
    await escribir('nombre', 'Otro nombre');
    const cerrado = vi.fn();
    fixture.componentInstance.cerrado.subscribe(cerrado);
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes('Cancelar'))!.click();
    await refrescar();
    expect(cerrado).toHaveBeenCalled();
    expect(borrador()).toBeNull();
  });
});

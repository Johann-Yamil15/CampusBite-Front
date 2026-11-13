import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { throwError } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { TemaService } from '@core/services/tema.service';
import { AuthFacade } from '@features/auth';
import { ToastService } from '@shared/ui/toast/toast.service';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import { PerfilRepository } from '@features/alumno/domain/repositories/perfil.repository';
import { SesionUiService } from '@features/alumno/presentation/sesion-ui.service';
import { PerfilPage } from './perfil.page';
import { provideCatalogoMock } from '@features/catalogo/data/mock/catalogo-mock.providers';
import { provideOrdenesMock } from '@features/ordenes/data/mock/ordenes-mock.providers';
import { provideFavoritosMock, providePerfilMock } from '@features/alumno/data/mock/alumno-mock.providers';

/** CL-Sprint5 11/11/2026 (etapa 8): perfil del alumno. */
describe('PerfilPage', () => {
  let fixture: ComponentFixture<PerfilPage>;
  let el: HTMLElement;

  async function abrir(antes?: () => void) {
    await TestBed.configureTestingModule({
      imports: [PerfilPage],
      providers: [
        provideRouter([]),
        provideOrdenesMock(),
        provideCatalogoMock(),
        provideFavoritosMock(),
        providePerfilMock(),
        { provide: AuthFacade, useValue: { user: signal({ email: 'alumno@ejemplo.test', name: 'Alumno de Prueba' }) } },
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
      ],
    }).compileComponents();
    antes?.();
    fixture = TestBed.createComponent(PerfilPage);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  const boton = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent!.includes(texto))!;
  const escribir = async (nombre: string, valor: string) => {
    const input = el.querySelector<HTMLInputElement>(`input[name="${nombre}"]`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  };
  const enviar = async (form: string) => {
    el.querySelector<HTMLFormElement>(`#${form}`)!.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
  };

  it('muestra el nombre del back (el mismo del layout), las iniciales y el correo', async () => {
    await abrir();
    expect(el.querySelector('.pf-nombre')!.textContent!.trim()).toBe('Alumno de Prueba');
    expect(el.querySelector('.pf-avatar')!.textContent!.trim()).toBe('AP');
    expect(el.querySelector('.pf-correo')!.textContent).toContain('alumno@ejemplo.test');
  });

  it('resume el historial con los pedidos simulados', async () => {
    await abrir();
    const stats = el.querySelector('.pf-stats')!.textContent!;
    expect(stats).toContain('3'); // 4 pedidos de la demo menos el cancelado
    expect(stats).toContain('Cafetería Central');
  });

  it('editar datos valida y, al guardar, cambia el nombre en el encabezado', async () => {
    await abrir();
    boton('Editar datos').click();
    await fixture.whenStable();
    await escribir('nombre', 'J');
    await escribir('telefono', '123');
    expect(el.querySelector('app-editar-datos')!.textContent).toContain('al menos 2 letras');
    expect(el.querySelector('app-editar-datos')!.textContent).toContain('10 a 15 dígitos');

    await escribir('nombre', 'Juan Pérez');
    await escribir('telefono', '442 123 4567');
    await enviar('form-datos');
    expect(el.querySelector('app-editar-datos')).toBeNull();
    expect(el.querySelector('.pf-nombre')!.textContent!.trim()).toBe('Juan Pérez');
    expect(el.querySelector('.pf-avatar')!.textContent!.trim()).toBe('JP');
    expect(TestBed.inject(PerfilFacade).nombre()).toBe('Juan Pérez');
  });

  it('cambiar contraseña: reglas en pantalla y "actual incorrecta" en su campo', async () => {
    await abrir();
    boton('Cambiar contraseña').click();
    await fixture.whenStable();
    await enviar('form-password');
    const modal = () => el.querySelector('app-cambiar-password')!.textContent!;
    expect(modal()).toContain('Escribe tu contraseña actual.');
    expect(modal()).toContain('al menos 8 caracteres');

    await escribir('actual', 'equivocada');
    await escribir('nueva', 'NuevaClave1');
    await escribir('confirmacion', 'NuevaClave1');
    await enviar('form-password');
    expect(modal()).toContain('La contraseña actual no es correcta.');

    await escribir('actual', 'Password123');
    await enviar('form-password');
    expect(el.querySelector('app-cambiar-password')).toBeNull();
    expect(TestBed.inject(ToastService).toasts().at(-1)!.text).toContain('Cambiaste tu contraseña');
  });

  it('guarda preferencias y avisos', async () => {
    await abrir();
    boton('Tarjeta').click();
    await fixture.whenStable();
    expect(boton('Tarjeta').getAttribute('aria-checked')).toBe('true');

    const promos = el.querySelector<HTMLInputElement>('#aviso-promos')!;
    promos.click();
    await fixture.whenStable();
    const perfil = TestBed.inject(PerfilFacade);
    expect(perfil.preferencias()).toMatchObject({ metodoPago: 'tarjeta', avisoPromociones: true });
  });

  it('si guardar un aviso falla, el interruptor regresa y avisa', async () => {
    await abrir();
    vi.spyOn(TestBed.inject(PerfilRepository), 'actualizarPreferencias').mockReturnValue(
      throwError(() => ({ status: 0, message: 'Sin conexión' })),
    );
    const listo = el.querySelector<HTMLInputElement>('#aviso-listo')!;
    listo.click();
    await fixture.whenStable();
    expect(listo.checked).toBe(true);
    expect(TestBed.inject(ToastService).toasts().at(-1)).toMatchObject({ kind: 'error', text: 'Sin conexión' });
  });

  it('apariencia y cerrar sesión', async () => {
    await abrir();
    boton('Oscuro').click();
    await fixture.whenStable();
    expect(TestBed.inject(TemaService).preferencia()).toBe('oscuro');
    expect(document.documentElement.dataset['theme']).toBe('dark');

    boton('Cerrar sesión').click();
    expect(TestBed.inject(SesionUiService).confirmandoSalida()).toBe(true);
    TestBed.inject(SesionUiService).cancelar();
  });

  it('si no carga muestra el error y "Reintentar"', async () => {
    let fallar = true;
    await abrir(() => {
      const repo = TestBed.inject(PerfilRepository);
      const real = repo.obtener.bind(repo);
      vi.spyOn(repo, 'obtener').mockImplementation(() =>
        fallar ? throwError(() => ({ status: 0, message: 'Sin conexión' })) : real(),
      );
    });
    expect(el.querySelector('.vacio')!.textContent).toContain('No pudimos cargar tu perfil');
    fallar = false;
    boton('Reintentar').click();
    await fixture.whenStable();
    expect(el.querySelector('.pf-nombre')).toBeTruthy();
  });
});

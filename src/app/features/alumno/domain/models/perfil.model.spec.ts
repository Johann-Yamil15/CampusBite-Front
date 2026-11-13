import {
  iniciales,
  nombreDesdeCorreo,
  nombreVisible,
  normalizarDatos,
  resumenHistorial,
  validarCambioPassword,
  validarDatos,
} from './perfil.model';

/** CL-Sprint5 11/11/2026 (etapa 8): reglas del perfil del alumno. */
describe('perfil.model', () => {
  it('el nombre visible es el escrito o, si no, el del correo con mayúsculas', () => {
    expect(nombreDesdeCorreo('alumno@ejemplo.test')).toBe('Alumno');
    expect(nombreVisible(null, 'juan.perez@uttt.edu.mx')).toBe('Juan Perez');
    expect(nombreVisible('  Juan Pérez ', 'x@y.z')).toBe('Juan Pérez');
    expect(iniciales('Juan Carlos Pérez')).toBe('JP');
    expect(iniciales('alumno')).toBe('A');
  });

  it('valida los datos con las reglas del registro', () => {
    expect(validarDatos({ nombre: 'J', matricula: '', telefono: '' }).nombre).toContain('al menos 2');
    expect(validarDatos({ nombre: 'Juan', matricula: 'x'.repeat(21), telefono: '' }).matricula).toBeDefined();
    expect(validarDatos({ nombre: 'Juan', matricula: '', telefono: '12345' }).telefono).toContain('10 a 15');
    expect(validarDatos({ nombre: 'Juan', matricula: '23300216', telefono: '442 123 4567' })).toEqual({});
    expect(normalizarDatos({ nombre: ' Juan ', matricula: ' ', telefono: '442-123-4567' })).toEqual({
      nombre: 'Juan',
      matricula: null,
      telefono: '4421234567',
    });
  });

  it('valida el cambio de contraseña', () => {
    expect(validarCambioPassword({ actual: '', nueva: 'corta', confirmacion: 'otra' })).toEqual({
      actual: 'Escribe tu contraseña actual.',
      nueva: 'La nueva contraseña necesita al menos 8 caracteres.',
      confirmacion: 'Las contraseñas no coinciden.',
    });
    expect(validarCambioPassword({ actual: 'Igual1234', nueva: 'Igual1234', confirmacion: 'Igual1234' }).nueva).toContain(
      'distinta',
    );
    expect(validarCambioPassword({ actual: 'Vieja1234', nueva: 'Nueva1234', confirmacion: 'Nueva1234' })).toEqual({});
  });

  it('resume el historial: sin cancelados, gasto del mes y la cafetería más visitada', () => {
    const o = (idCafeteria: string, estado: string, total: number, creadoEn: string) => ({
      idCafeteria,
      cafeteria: idCafeteria.toUpperCase(),
      estado,
      total,
      creadoEn,
    });
    const r = resumenHistorial(
      [
        o('a', 'entregada', 100, '2026-11-05T12:00:00-06:00'),
        o('b', 'lista', 50, '2026-11-04T12:00:00-06:00'),
        o('a', 'cancelada', 999, '2026-11-03T12:00:00-06:00'),
        o('a', 'entregada', 30, '2026-10-20T12:00:00-06:00'),
      ],
      new Date(2026, 10, 11),
    );
    expect(r).toEqual({
      pedidosTotales: 3,
      gastadoMes: 150,
      cafeteriaFrecuente: { idCafeteria: 'a', nombre: 'A', pedidos: 2 },
    });
    expect(resumenHistorial([], new Date()).cafeteriaFrecuente).toBeNull();
  });
});

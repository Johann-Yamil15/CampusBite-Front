import { PerfilMapper } from './perfil.mapper';

/** CL-Sprint5 13/11/2026: el método de pago viaja en PascalCase (enum MetodoPago del back). */
describe('PerfilMapper', () => {
  it('lee el perfil con el método preferido en minúsculas', () => {
    expect(
      PerfilMapper.toDomain({
        correo: 'a@b.mx',
        datos: { nombre: 'Juan', matricula: null, telefono: '4421234567' },
        preferencias: {
          idCafeteriaFrecuente: 'c1',
          metodoPago: 'Transferencia',
          avisoPedidoListo: true,
          avisoPromociones: false,
        },
      }),
    ).toEqual({
      correo: 'a@b.mx',
      datos: { nombre: 'Juan', matricula: null, telefono: '4421234567' },
      preferencias: {
        idCafeteriaFrecuente: 'c1',
        metodoPago: 'transferencia',
        avisoPedidoListo: true,
        avisoPromociones: false,
      },
    });
  });

  it('manda las preferencias con el método en PascalCase (o null)', () => {
    const base = { idCafeteriaFrecuente: null, avisoPedidoListo: false, avisoPromociones: true };
    expect(PerfilMapper.toPreferenciasRequest({ ...base, metodoPago: 'efectivo' }).metodoPago).toBe('Efectivo');
    expect(PerfilMapper.toPreferenciasRequest({ ...base, metodoPago: 'tarjeta' }).metodoPago).toBe('Tarjeta');
    expect(PerfilMapper.toPreferenciasRequest({ ...base, metodoPago: null }).metodoPago).toBeNull();
  });
});

import { NegocioMapper } from './negocio.mapper';

/** CL-Sprint5 13/11/2026: el tipo de promoción viaja en PascalCase (enum TipoPromocion del back). */
describe('NegocioMapper', () => {
  it('lee el tipo en minúsculas y la descripción vacía si llega null', () => {
    expect(
      NegocioMapper.toPromocion({
        id: 'p1',
        nombre: 'Desayuno',
        descripcion: null,
        tipo: 'PrecioFijo',
        valor: 45,
        desde: '2026-11-01',
        hasta: '2026-11-30',
        activa: true,
        usos: 0,
      }),
    ).toMatchObject({ tipo: 'precio_fijo', descripcion: '' });
  });

  it('manda el tipo en PascalCase, sin id ni usos', () => {
    const cuerpo = NegocioMapper.toGuardarRequest({
      id: 'p1',
      nombre: ' Combo ',
      descripcion: '  ',
      tipo: 'combo',
      valor: 79,
      desde: '2026-11-01',
      hasta: '2026-11-30',
      activa: false,
      usos: 3,
    });
    expect(cuerpo).toEqual({
      nombre: 'Combo',
      descripcion: null,
      tipo: 'Combo',
      valor: 79,
      desde: '2026-11-01',
      hasta: '2026-11-30',
      activa: false,
    });
    expect(NegocioMapper.toGuardarRequest({ ...cuerpo, id: '', usos: 0, descripcion: 'x', tipo: 'porcentaje' }).tipo)
      .toBe('Porcentaje');
  });
});

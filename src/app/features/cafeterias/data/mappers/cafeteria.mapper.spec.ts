import { CafeteriaMapper } from './cafeteria.mapper';

describe('CafeteriaMapper', () => {
  it('convierte el DTO del API a la entidad de dominio', () => {
    const cafeteria = CafeteriaMapper.toDomain({
      idCafeteria: '00000000-0000-0000-0000-0000000000c1',
      nombre: 'Cafetería Central',
      ubicacion: 'Edificio principal, planta baja',
      esDelCampus: true,
      puntoEntrega: 'Puerta 1',
      activa: true,
      metodosPago: ['Tarjeta', 'Efectivo'],
      creadoEn: '2026-10-20T12:00:00+00:00',
      actualizadoEn: '2026-10-20T13:30:00+00:00',
    });

    expect(cafeteria).toEqual({
      id: '00000000-0000-0000-0000-0000000000c1',
      name: 'Cafetería Central',
      location: 'Edificio principal, planta baja',
      onCampus: true,
      pickupPoint: 'Puerta 1',
      active: true,
      paymentMethods: ['Tarjeta', 'Efectivo'],
      createdAt: new Date('2026-10-20T12:00:00Z'),
      updatedAt: new Date('2026-10-20T13:30:00Z'),
    });
  });

  it('arma el body de alta/edición con los nombres del backend', () => {
    expect(
      CafeteriaMapper.toRequest({
        name: 'Cafetería Norte',
        location: 'Edificio K',
        onCampus: false,
        pickupPoint: 'Mostrador',
        paymentMethods: ['Efectivo'],
      }),
    ).toEqual({
      nombre: 'Cafetería Norte',
      ubicacion: 'Edificio K',
      esDelCampus: false,
      puntoEntrega: 'Mostrador',
      metodosPago: ['Efectivo'],
    });
  });
});

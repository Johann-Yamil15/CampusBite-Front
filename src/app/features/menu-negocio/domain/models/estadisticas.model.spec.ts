import { estadisticas } from './estadisticas.model';

/** CL-Sprint5 11/11/2026 (etapa 9): estadísticas calculadas con las órdenes. */
describe('estadisticas', () => {
  const ahora = new Date(2026, 10, 11, 12, 0); // miércoles
  const orden = (estado: string, total: number, creadoEn: Date, producto = 'Latte', cantidad = 1) => ({
    estado,
    total,
    creadoEn: creadoEn.toISOString(),
    lineas: [{ idProducto: producto, producto, cantidad, precioUnitario: total / cantidad }],
  });
  const ordenes = [
    orden('entregada', 100, new Date(2026, 10, 11, 9, 10), 'Latte', 2),
    orden('lista', 60, new Date(2026, 10, 11, 9, 40), 'Panini', 1),
    orden('cancelada', 500, new Date(2026, 10, 11, 10, 0), 'Combo', 5),
    orden('confirmada', 40, new Date(2026, 10, 8, 13, 0), 'Latte', 1),
    orden('entregada', 999, new Date(2026, 9, 1, 13, 0)), // fuera de 30 días
  ];

  it('hoy: ventas sin cancelados, ticket, por estado y horas pico', () => {
    const e = estadisticas(ordenes, 'hoy', ahora);
    expect(e).toMatchObject({ ventas: 160, pedidos: 2, ticketPromedio: 80, cancelados: 1 });
    expect(e.porEstado).toEqual({ nuevos: 0, preparacion: 0, listos: 1, entregados: 1, cancelados: 1 });
    expect(e.horasPico).toEqual([{ etiqueta: '09:00', valor: 2 }]);
    expect(e.ventasPorDia).toEqual([{ etiqueta: 'Hoy', valor: 160 }]);
  });

  it('7 días: una barra por día y los más vendidos por piezas', () => {
    const e = estadisticas(ordenes, '7d', ahora);
    expect(e.ventas).toBe(200);
    expect(e.ventasPorDia.map((b) => b.etiqueta)).toEqual(['Jue', 'Vie', 'Sáb', 'Dom', 'Lun', 'Mar', 'Hoy']);
    expect(e.ventasPorDia.find((b) => b.etiqueta === 'Dom')!.valor).toBe(40);
    expect(e.masVendidos[0]).toEqual({ producto: 'Latte', piezas: 3, monto: 140 });
    expect(e.masVendidos.map((t) => t.producto)).not.toContain('Combo');
  });
});

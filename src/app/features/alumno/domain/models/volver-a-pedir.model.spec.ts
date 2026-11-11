import { planRepetir } from './volver-a-pedir.model';

/** CL-Sprint5 11/11/2026 (etapa 6). */
describe('planRepetir', () => {
  const cafeteria = { idCafeteria: 'c1', nombre: 'Central' };
  const vigentes = [{ idProducto: 'p1', producto: 'Sándwich', precio: 60, imagenUrl: null }];

  it('usa el producto real con su precio de hoy y reporta lo que ya no está', () => {
    const plan = planRepetir(
      [
        { idProducto: 'p1', producto: 'Sándwich', cantidad: 2 },
        { idProducto: 'p9', producto: 'Malteada', cantidad: 1 },
      ],
      vigentes,
      cafeteria,
    );
    expect(plan.items).toEqual([
      { idProducto: 'p1', producto: 'Sándwich', precio: 60, cantidad: 2, imagenUrl: null, idCafeteria: 'c1', cafeteria: 'Central' },
    ]);
    expect(plan.noDisponibles).toEqual(['Malteada']);
  });

  it('respeta el tope de 20 por producto', () => {
    const plan = planRepetir(
      [
        { idProducto: 'p1', producto: 'Sándwich', cantidad: 15 },
        { idProducto: 'p1', producto: 'Sándwich', cantidad: 15 },
      ],
      vigentes,
      cafeteria,
    );
    expect(plan.items[0].cantidad).toBe(20);
  });
});

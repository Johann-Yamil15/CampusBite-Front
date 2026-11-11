import {
  cancelablePorAlumno,
  enCurso,
  etapa,
  folioDe,
  pasoAlumno,
  piezas,
  puedeTransicionar,
  totalLineas,
} from './orden.model';

describe('orden.model', () => {
  it('sigue la máquina de estados del trigger de la BD', () => {
    expect(puedeTransicionar('pendiente', 'confirmada')).toBe(true);
    expect(puedeTransicionar('confirmada', 'en_preparacion')).toBe(true);
    expect(puedeTransicionar('en_preparacion', 'lista')).toBe(true);
    expect(puedeTransicionar('lista', 'entregada')).toBe(true);
    expect(puedeTransicionar('lista', 'cancelada')).toBe(true);
    // Saltos y regresos no
    expect(puedeTransicionar('pendiente', 'en_preparacion')).toBe(false);
    expect(puedeTransicionar('lista', 'en_preparacion')).toBe(false);
    expect(puedeTransicionar('entregada', 'cancelada')).toBe(false);
  });

  it('el alumno solo cancela antes de preparación', () => {
    expect(cancelablePorAlumno({ estado: 'pendiente' })).toBe(true);
    expect(cancelablePorAlumno({ estado: 'confirmada' })).toBe(true);
    expect(cancelablePorAlumno({ estado: 'en_preparacion' })).toBe(false);
    expect(cancelablePorAlumno({ estado: 'lista' })).toBe(false);
  });

  it('en curso = ni entregada ni cancelada', () => {
    expect(enCurso({ estado: 'lista' })).toBe(true);
    expect(enCurso({ estado: 'entregada' })).toBe(false);
    expect(enCurso({ estado: 'cancelada' })).toBe(false);
  });

  it('pendiente y confirmada se ven como "Recibido" (paso 0)', () => {
    expect(etapa('pendiente')).toBe('recibido');
    expect(etapa('confirmada')).toBe('recibido');
    expect(pasoAlumno('confirmada')).toBe(0);
    expect(pasoAlumno('lista')).toBe(2);
    expect(pasoAlumno('entregada')).toBe(3);
    expect(pasoAlumno('cancelada')).toBe(-1);
  });

  it('folio corto a partir del UUID', () => {
    expect(folioDe('24110042-0000-4000-8000-000000000000')).toBe('CB-2411-0042');
    expect(folioDe('a1b2c3d4-e5f6-4000-8000-000000000000')).toBe('CB-A1B2-C3D4');
  });

  it('piezas y total de las líneas', () => {
    const lineas = [
      { idProducto: 'a', producto: 'A', cantidad: 2, precioUnitario: 10, imagenUrl: null },
      { idProducto: 'b', producto: 'B', cantidad: 1, precioUnitario: 5.5, imagenUrl: null },
    ];
    expect(piezas({ lineas })).toBe(3);
    expect(totalLineas(lineas)).toBe(25.5);
  });
});

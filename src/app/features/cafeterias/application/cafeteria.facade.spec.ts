import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { CafeteriaRepository } from '@features/cafeterias/domain/repositories/cafeteria.repository';
import { Cafeteria, CafeteriaData } from '@features/cafeterias/domain/models/cafeteria.model';
import { CafeteriaFacade } from './cafeteria.facade';

const cafeteria = (id: string, name: string, active = true): Cafeteria => ({
  id,
  name,
  location: 'Edificio A',
  onCampus: true,
  pickupPoint: 'Puerta 1',
  active,
  paymentMethods: ['Efectivo'],
  createdAt: new Date('2026-10-20T12:00:00Z'),
  updatedAt: new Date('2026-10-20T12:00:00Z'),
});

const DATA: CafeteriaData = {
  name: 'Beta',
  location: 'Edificio B',
  onCampus: true,
  pickupPoint: 'Mostrador',
  paymentMethods: ['Tarjeta'],
};

/** Repositorio en memoria: cada prueba fija lo que responde. */
class FakeCafeteriaRepository extends CafeteriaRepository {
  listResult: Observable<Cafeteria[]> = of([]);
  result: Observable<Cafeteria> = of(cafeteria('x', 'X'));
  voidResult: Observable<void> = of(undefined);

  list = vi.fn(() => this.listResult);
  getById = vi.fn(() => this.result);
  create = vi.fn(() => this.result);
  update = vi.fn(() => this.result);
  deactivate = vi.fn(() => this.voidResult);
  reactivate = vi.fn(() => this.voidResult);
}

/** CL-Sprint3 20/10/2026: estado de la facade (signals) tras cada operación. */
describe('CafeteriaFacade', () => {
  let facade: CafeteriaFacade;
  let repo: FakeCafeteriaRepository;

  beforeEach(() => {
    repo = new FakeCafeteriaRepository();
    TestBed.configureTestingModule({
      providers: [{ provide: CafeteriaRepository, useValue: repo }],
    });
    facade = TestBed.inject(CafeteriaFacade);
  });

  it('load llena la lista y por defecto pide solo activas', () => {
    repo.listResult = of([cafeteria('1', 'Alfa')]);
    facade.load().subscribe();

    expect(repo.list).toHaveBeenCalledWith(false);
    expect(facade.list().map((c) => c.name)).toEqual(['Alfa']);
    expect(facade.loading()).toBe(false);
    expect(facade.error()).toBeNull();
  });

  it('no hace la petición hasta que alguien se suscribe', () => {
    facade.load();
    expect(repo.list).not.toHaveBeenCalled();
  });

  it('create agrega a la lista ordenada por nombre y la selecciona', () => {
    repo.listResult = of([cafeteria('1', 'Alfa'), cafeteria('3', 'Gama')]);
    facade.load().subscribe();
    repo.result = of(cafeteria('2', 'Beta'));

    facade.create(DATA).subscribe();

    expect(repo.create).toHaveBeenCalledWith(DATA);
    expect(facade.list().map((c) => c.name)).toEqual(['Alfa', 'Beta', 'Gama']);
    expect(facade.selected()?.id).toBe('2');
  });

  it('update reemplaza la cafetería en la lista y en selected', () => {
    repo.listResult = of([cafeteria('1', 'Alfa')]);
    facade.load().subscribe();
    repo.result = of(cafeteria('1', 'Alfa renovada'));

    facade.update('1', DATA).subscribe();

    expect(facade.list()[0].name).toBe('Alfa renovada');
    expect(facade.selected()?.name).toBe('Alfa renovada');
  });

  it('deactivate quita la cafetería si la lista es solo de activas', () => {
    repo.listResult = of([cafeteria('1', 'Alfa'), cafeteria('2', 'Beta')]);
    facade.load().subscribe();

    facade.deactivate('1').subscribe();

    expect(facade.list().map((c) => c.id)).toEqual(['2']);
  });

  it('deactivate/reactivate solo cambian active si la lista incluye inactivas', () => {
    repo.listResult = of([cafeteria('1', 'Alfa')]);
    facade.load({ includeInactive: true }).subscribe();
    facade.select(facade.list()[0]);

    facade.deactivate('1').subscribe();
    expect(facade.list()[0].active).toBe(false);
    expect(facade.selected()?.active).toBe(false);

    facade.reactivate('1').subscribe();
    expect(facade.list()[0].active).toBe(true);
    expect(repo.list).toHaveBeenCalledWith(true);
  });

  it('en error deja el mensaje del backend y apaga loading', () => {
    const forbidden: ApiError = {
      status: 403,
      message: 'Tu rol no tiene permiso para usar este recurso.',
    };
    repo.result = throwError(() => forbidden);
    let received: ApiError | undefined;

    facade.create(DATA).subscribe({ error: (e: ApiError) => (received = e) });

    expect(received?.status).toBe(403);
    expect(facade.error()).toBe('Tu rol no tiene permiso para usar este recurso.');
    expect(facade.loading()).toBe(false);
  });

  it('en un 400 muestra el primer error de validación por campo', () => {
    repo.result = throwError((): ApiError => ({
      status: 400,
      message: 'Revisa los campos indicados en errors.',
      errors: { Nombre: ['El nombre debe tener al menos 2 caracteres.'] },
    }));

    facade.create(DATA).subscribe({ error: () => undefined });

    expect(facade.error()).toBe('El nombre debe tener al menos 2 caracteres.');
  });
});

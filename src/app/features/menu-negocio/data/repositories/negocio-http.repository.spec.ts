import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HorarioDto, PromocionNegocioDto } from '@features/menu-negocio/data/dtos/negocio.dto';
import { PromocionNegocio } from '@features/menu-negocio/domain/models/negocio.model';
import { NegocioHttpRepository } from './negocio-http.repository';

const CAF = 'c1';
const HORARIO: HorarioDto = {
  dias: Array.from({ length: 7 }, () => ({ abre: true, desde: '07:00', hasta: '17:00' })),
  cerradoHoy: false,
  abiertaAhora: true,
};
const PROMO_DTO: PromocionNegocioDto = {
  id: 'p1', nombre: 'Combo', descripcion: null, tipo: 'Combo', valor: 79,
  desde: '2026-11-01', hasta: '2026-11-30', activa: true, usos: 0,
};

/** JJ-Sprint5 13/11/2026: rutas, verbos y mapeo de api/cafeterias/{id}/horario y /promociones. */
describe('NegocioHttpRepository', () => {
  let repo: NegocioHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), NegocioHttpRepository],
    });
    repo = TestBed.inject(NegocioHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lee, guarda, cierra y reabre el horario', () => {
    const horarios: boolean[] = [];
    repo.horario(CAF).subscribe((h) => horarios.push(h.abiertaAhora));
    const get = http.expectOne(`/api/cafeterias/${CAF}/horario`);
    expect(get.request.method).toBe('GET');
    get.flush(HORARIO);

    repo.guardarHorario(CAF, HORARIO.dias).subscribe((h) => horarios.push(h.abiertaAhora));
    const put = http.expectOne(`/api/cafeterias/${CAF}/horario`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ dias: HORARIO.dias });
    put.flush(HORARIO);

    repo.cerrarHoy(CAF).subscribe((h) => horarios.push(h.cerradoHoy));
    const post = http.expectOne(`/api/cafeterias/${CAF}/horario/cierre-hoy`);
    expect(post.request.method).toBe('POST');
    post.flush({ ...HORARIO, cerradoHoy: true });

    repo.reabrir(CAF).subscribe((h) => horarios.push(h.cerradoHoy));
    const del = http.expectOne(`/api/cafeterias/${CAF}/horario/cierre-hoy`);
    expect(del.request.method).toBe('DELETE');
    del.flush(HORARIO);

    // abiertaAhora (GET), abiertaAhora (PUT), cerradoHoy (POST), cerradoHoy (DELETE)
    expect(horarios).toEqual([true, true, true, false]);
  });

  it('lista, crea (POST), edita (PUT) y elimina promociones con el tipo en minúsculas', () => {
    let lista: PromocionNegocio[] = [];
    repo.promociones(CAF).subscribe((p) => (lista = p));
    http.expectOne(`/api/cafeterias/${CAF}/promociones`).flush([PROMO_DTO]);
    expect(lista[0]).toMatchObject({ tipo: 'combo', descripcion: '' });

    const nueva = { ...lista[0], id: '' };
    repo.guardarPromocion(CAF, nueva).subscribe();
    const post = http.expectOne(`/api/cafeterias/${CAF}/promociones`);
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toMatchObject({ tipo: 'Combo', descripcion: null });
    post.flush(PROMO_DTO);

    repo.guardarPromocion(CAF, lista[0]).subscribe();
    const put = http.expectOne(`/api/cafeterias/${CAF}/promociones/p1`);
    expect(put.request.method).toBe('PUT');
    put.flush(PROMO_DTO);

    repo.eliminarPromocion(CAF, 'p1').subscribe();
    const del = http.expectOne(`/api/cafeterias/${CAF}/promociones/p1`);
    expect(del.request.method).toBe('DELETE');
    del.flush(null);
  });
});

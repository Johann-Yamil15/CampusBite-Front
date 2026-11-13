import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FavoritoCafeteriaDto, FavoritoPlatilloDto } from '@features/alumno/data/dtos/alumno.dto';
import { CafeteriaFavorita, PlatilloFavorito } from '@features/alumno/domain/models/favorito.model';
import { FavoritosHttpRepository } from './favoritos-http.repository';

const CAFETERIA: FavoritoCafeteriaDto = {
  idCafeteria: 'c1', nombre: 'Cafetería Central', foto: null, calificacion: null,
  puntoEntrega: 'Barra', esDelCampus: true, abierta: true, platillos: 4,
};
const PLATILLO: FavoritoPlatilloDto = {
  idProducto: 'p1', producto: 'Latte', precio: 38, imagenUrl: null,
  idCafeteria: 'c1', cafeteria: 'Cafetería Central', disponible: false, cafeteriaAbierta: true,
};

/** JJ-Sprint5 13/11/2026: rutas, verbos y mapeo de api/favoritos/... (PUT y DELETE idempotentes). */
describe('FavoritosHttpRepository', () => {
  let repo: FavoritosHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), FavoritosHttpRepository],
    });
    repo = TestBed.inject(FavoritosHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('cafeterías: lista, agrega (PUT) y quita (DELETE); sin foto queda vacía', () => {
    let lista: CafeteriaFavorita[] = [];
    let agregada: CafeteriaFavorita | null = null;
    repo.listarCafeterias().subscribe((c) => (lista = c));
    http.expectOne('/api/favoritos/cafeterias').flush([CAFETERIA]);
    expect(lista[0].foto).toBe('');

    repo.agregarCafeteria('c1').subscribe((c) => (agregada = c));
    const put = http.expectOne('/api/favoritos/cafeterias/c1');
    expect(put.request.method).toBe('PUT');
    put.flush({ ...CAFETERIA, foto: 'https://x/portada.webp' });
    expect(agregada!.foto).toBe('https://x/portada.webp');

    repo.quitarCafeteria('c1').subscribe();
    expect(http.expectOne('/api/favoritos/cafeterias/c1').request.method).toBe('DELETE');
  });

  it('platillos: lista, agrega y quita conservando "disponible"', () => {
    let lista: PlatilloFavorito[] = [];
    repo.listarPlatillos().subscribe((p) => (lista = p));
    http.expectOne('/api/favoritos/platillos').flush([PLATILLO]);
    expect(lista[0]).toMatchObject({ producto: 'Latte', disponible: false });

    repo.agregarPlatillo('p1').subscribe();
    const put = http.expectOne('/api/favoritos/platillos/p1');
    expect(put.request.method).toBe('PUT');
    put.flush(PLATILLO);

    repo.quitarPlatillo('p1').subscribe();
    expect(http.expectOne('/api/favoritos/platillos/p1').request.method).toBe('DELETE');
  });
});

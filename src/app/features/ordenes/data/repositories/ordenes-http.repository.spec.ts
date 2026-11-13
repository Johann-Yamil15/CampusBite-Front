import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Orden } from '@features/ordenes/domain/models/orden.model';
import { OrdenDto } from '@features/ordenes/data/dtos/orden.dto';
import { OrdenesHttpRepository } from './ordenes-http.repository';

const ID = 'a1b2c3d4-e5f6-4000-8000-000000000001';

const DTO: OrdenDto = {
  idOrden: ID,
  idCafeteria: 'c1',
  cafeteria: 'Cafetería Central',
  logoCafeteria: null,
  puntoEntrega: 'Barra',
  alumno: null,
  estado: 'EnPreparacion',
  recogidaEn: '2026-11-11T13:00:00-06:00',
  creadoEn: '2026-11-11T12:30:00-06:00',
  codigoRecogida: '048213',
  total: 76,
  metodo: 'Efectivo',
  estadoPago: 'Pendiente',
  notas: null,
  motivoCancelacion: null,
  lineas: [{ idProducto: 'p1', producto: 'Latte', cantidad: 2, precioUnitario: 38, imagenUrl: null }],
};

/** CL-Sprint5 11/11/2026: rutas, verbos y mapeo del contrato de api/ordenes. */
describe('OrdenesHttpRepository', () => {
  let repo: OrdenesHttpRepository;
  let http: HttpTestingController;
  let recibida: Orden | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), OrdenesHttpRepository],
    });
    repo = TestBed.inject(OrdenesHttpRepository);
    http = TestBed.inject(HttpTestingController);
    recibida = null;
  });

  afterEach(() => http.verify());

  it('crear manda POST /api/ordenes con el método en PascalCase y mapea la respuesta', () => {
    repo
      .crear({
        idCafeteria: 'c1',
        recogidaEn: '2026-11-11T13:00:00-06:00',
        metodo: 'efectivo',
        items: [{ idProducto: 'p1', cantidad: 2 }],
      })
      .subscribe((o) => (recibida = o));

    const req = http.expectOne('/api/ordenes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      idCafeteria: 'c1',
      recogidaEn: '2026-11-11T13:00:00-06:00',
      metodo: 'Efectivo',
      items: [{ idProducto: 'p1', cantidad: 2 }],
    });
    req.flush(DTO);

    expect(recibida).toMatchObject({
      estado: 'en_preparacion',
      metodo: 'efectivo',
      estadoPago: 'pendiente',
      folio: 'CB-A1B2-C3D4',
      codigoRecogida: '048213',
    });
  });

  it('reportar manda POST /api/ordenes/{id}/reportes (etapa 6)', () => {
    let folio = '';
    repo.reportar(ID, { motivo: 'falto_articulo', detalle: '  ' }).subscribe((r) => (folio = r.folio));
    const req = http.expectOne(`/api/ordenes/${ID}/reportes`);
    expect(req.request.method).toBe('POST');
    // CL-Sprint5 13/11/2026: el enum MotivoReporte del back es PascalCase
    expect(req.request.body).toEqual({ motivo: 'FaltoArticulo', detalle: null });
    req.flush({ folio: 'R-123456' });
    expect(folio).toBe('R-123456');
  });

  it('misOrdenes pide la primera página y devuelve sus items', () => {
    let total = -1;
    repo.misOrdenes().subscribe((lista) => (total = lista.length));
    const req = http.expectOne(
      (r) => r.url === '/api/ordenes/mias' && r.params.get('pagina') === '1',
    );
    req.flush({ items: [DTO], total: 1, pagina: 1, tamanoPagina: 50 });
    expect(total).toBe(1);
  });

  it('cambiarEstado manda PATCH con el estado en PascalCase', () => {
    repo.cambiarEstado(ID, 'lista').subscribe();
    const req = http.expectOne(`/api/ordenes/${ID}/estado`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ estado: 'Lista' });
    req.flush({ ...DTO, estado: 'Lista' });
  });

  it('entregar y rechazar mandan su dato en el cuerpo', () => {
    repo.entregar(ID, '048213').subscribe();
    expect(http.expectOne(`/api/ordenes/${ID}/entregar`).request.body).toEqual({
      codigoRecogida: '048213',
    });

    repo.rechazar(ID, 'Sin insumos').subscribe();
    expect(http.expectOne(`/api/ordenes/${ID}/rechazar`).request.body).toEqual({
      motivo: 'Sin insumos',
    });
  });

  it('ordenesCafeteria hace GET a /api/cafeterias/:id/ordenes', () => {
    repo.ordenesCafeteria('c1').subscribe();
    http.expectOne('/api/cafeterias/c1/ordenes').flush([]);
  });
});

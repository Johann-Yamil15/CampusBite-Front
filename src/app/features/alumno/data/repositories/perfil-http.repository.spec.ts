import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PerfilAlumnoDto } from '@features/alumno/data/dtos/alumno.dto';
import { DatosPersonales, PerfilAlumno, PreferenciasAlumno } from '@features/alumno/domain/models/perfil.model';
import { PerfilHttpRepository } from './perfil-http.repository';

const PERFIL: PerfilAlumnoDto = {
  correo: 'juan@uttt.edu.mx',
  datos: { nombre: 'Juan', matricula: null, telefono: null },
  preferencias: { idCafeteriaFrecuente: null, metodoPago: null, avisoPedidoListo: true, avisoPromociones: false },
};

/** JJ-Sprint5 13/11/2026: rutas, verbos y mapeo de api/alumnos/me/... y api/auth/cambiar-password. */
describe('PerfilHttpRepository', () => {
  let repo: PerfilHttpRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PerfilHttpRepository],
    });
    repo = TestBed.inject(PerfilHttpRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene el perfil sin método preferido ni datos opcionales', () => {
    let perfil: PerfilAlumno | null = null;
    repo.obtener().subscribe((p) => (perfil = p));
    http.expectOne('/api/alumnos/me/perfil').flush(PERFIL);
    expect(perfil!.preferencias.metodoPago).toBeNull();
    expect(perfil!.datos).toEqual({ nombre: 'Juan', matricula: null, telefono: null });
  });

  it('actualiza los datos (PUT) y manda nombre vacío si el formulario no lo trae', () => {
    let datos: DatosPersonales | null = null;
    repo.actualizarDatos({ nombre: null, matricula: 'UTT1', telefono: null }).subscribe((d) => (datos = d));
    const put = http.expectOne('/api/alumnos/me/perfil');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({ nombre: '', matricula: 'UTT1', telefono: null });
    put.flush({ nombre: 'Juan', matricula: 'UTT1' });
    expect(datos).toEqual({ nombre: 'Juan', matricula: 'UTT1', telefono: null });
  });

  it('actualiza las preferencias con el método en PascalCase y sin él', () => {
    let pref: PreferenciasAlumno | null = null;
    const base = { idCafeteriaFrecuente: 'c1', avisoPedidoListo: false, avisoPromociones: true };

    repo.actualizarPreferencias({ ...base, metodoPago: 'tarjeta' }).subscribe((p) => (pref = p));
    const put = http.expectOne('/api/alumnos/me/preferencias');
    expect(put.request.body).toMatchObject({ metodoPago: 'Tarjeta' });
    put.flush({ ...base, metodoPago: 'Tarjeta' });
    expect(pref!.metodoPago).toBe('tarjeta');

    repo.actualizarPreferencias({ ...base, metodoPago: null }).subscribe();
    const sinMetodo = http.expectOne('/api/alumnos/me/preferencias');
    expect(sinMetodo.request.body).toMatchObject({ metodoPago: null });
    sinMetodo.flush({ ...base, idCafeteriaFrecuente: undefined, metodoPago: null });
  });

  it('cambia la contraseña con POST api/auth/cambiar-password', () => {
    repo.cambiarPassword('Actual123', 'Nueva12345').subscribe();
    const post = http.expectOne('/api/auth/cambiar-password');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({ passwordActual: 'Actual123', passwordNueva: 'Nueva12345' });
    post.flush(null);
  });
});

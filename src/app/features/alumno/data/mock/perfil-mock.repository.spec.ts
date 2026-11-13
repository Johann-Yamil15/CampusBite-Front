import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { TokenStorageService } from '@core/services/token-storage.service';
import { CLAVE_PERFIL, PASSWORD_DEMO, PerfilMockRepository } from './perfil-mock.repository';

const tokenDe = (sub: string, email: string) =>
  `x.${btoa(JSON.stringify({ sub, email })).replace(/=+$/, '')}.y`;

/** CL-Sprint5 11/11/2026 (etapa 8): perfil simulado, persistente por usuario. */
describe('PerfilMockRepository', () => {
  const valor = <T>(o: Observable<T>) => firstValueFrom(o);

  function crear(sub: string): PerfilMockRepository {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: MOCK_LATENCIA_MS, useValue: 0 }, PerfilMockRepository] });
    TestBed.inject(TokenStorageService).set(tokenDe(sub, `${sub}@uttt.edu.mx`));
    return TestBed.inject(PerfilMockRepository);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('arranca sin nombre, con el correo de la sesión y los avisos de pedido encendidos', async () => {
    const perfil = await valor(crear('ana').obtener());
    expect(perfil.correo).toBe('ana@uttt.edu.mx');
    expect(perfil.datos.nombre).toBeNull();
    expect(perfil.preferencias).toMatchObject({ avisoPedidoListo: true, avisoPromociones: false, metodoPago: null });
  });

  it('guarda datos y preferencias por usuario', async () => {
    const repo = crear('ana');
    await valor(repo.actualizarDatos({ nombre: 'Ana Ramírez', matricula: '23300118', telefono: null }));
    await valor(repo.actualizarPreferencias({ idCafeteriaFrecuente: 'c1', metodoPago: 'tarjeta', avisoPedidoListo: false, avisoPromociones: true }));
    expect(localStorage.getItem(CLAVE_PERFIL + 'ana')).toContain('Ana Ramírez');

    const otraVez = await valor(crear('ana').obtener());
    expect(otraVez.datos.nombre).toBe('Ana Ramírez');
    expect(otraVez.preferencias.metodoPago).toBe('tarjeta');
    expect((await valor(crear('luis').obtener())).datos.nombre).toBeNull();
  });

  it('rechaza datos inválidos con 422', async () => {
    await expect(valor(crear('ana').actualizarDatos({ nombre: 'A', matricula: null, telefono: null }))).rejects.toMatchObject({
      status: 422,
    });
  });

  it('cambiar contraseña exige la actual correcta', async () => {
    const repo = crear('ana');
    await expect(valor(repo.cambiarPassword('otra-cosa', 'Nueva12345'))).rejects.toMatchObject({
      status: 400,
      message: 'La contraseña actual no es correcta.',
    });
    await expect(valor(repo.cambiarPassword(PASSWORD_DEMO, 'Nueva12345'))).resolves.toBeUndefined();
  });
});

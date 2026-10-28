import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { EMPTY, Observable, firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { User, UserRole } from '@features/auth/domain/models/user.model';
import { AuthRepository } from '@features/auth/domain/repositories/auth.repository';
import { TokenStorageService } from '@core/services/token-storage.service';
import { Cafeteria, CafeteriaFacade } from '@features/cafeterias';
import { negocioHomeGuard, roleGuard } from './auth.guard';

// JJ-Sprint3 21/10/2026: pruebas del guard por rol (panel admin solo para AdminSistema)
describe('roleGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/admin' } as RouterStateSnapshot;

  function run(session: boolean, role: UserRole | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: {
            hasValidSession: () => session,
            hasRole: (...roles: UserRole[]) => role !== null && roles.includes(role),
          },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() => roleGuard('AdminSistema')(route, state));
    const router = TestBed.inject(Router);
    return result instanceof UrlTree ? router.serializeUrl(result) : result;
  }

  it('deja pasar al rol permitido', () => {
    expect(run(true, 'AdminSistema')).toBe(true);
  });

  it('manda al inicio a un usuario con otro rol', () => {
    expect(run(true, 'Alumno')).toBe('/');
  });

  it('manda al login (con returnUrl) si no hay sesión', () => {
    expect(run(false, null)).toBe('/auth/login?returnUrl=%2Fadmin');
  });
});

// CL-Sprint4 28/10/2026: HU-07B. El encargado con cafetería conocida va directo a su panel; si no, se busca
// con resolverCafeteriaDelEncargado (TEMPORAL), que aquí usa AuthRepository y CafeteriaFacade falsos.
describe('negocioHomeGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/' } as RouterStateSnapshot;

  interface Options {
    me$?: Observable<User>;
    /** Respuesta de GET cafeterias/{id}/productos por id (200 si no se indica otra cosa). */
    status?: Record<string, number>;
    cafeterias?: string[];
  }

  async function run(role: UserRole, user: User | null, options: Options = {}) {
    const { me$ = EMPTY, status = {}, cafeterias = ['c-a', 'c-b'] } = options;
    const loadCurrentUser = vi.fn(() => me$);
    // Mismo contrato que AuthHttpRepository: 200 → true, 403 → false, otro error → falla
    const get = vi.fn((id: string) => {
      const code = status[id] ?? 200;
      return code === 500 ? throwError(() => ({ status: code })) : of(code === 200);
    });
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: {
            hasRole: (...roles: UserRole[]) => roles.includes(role),
            user: () => user,
            loadCurrentUser,
          },
        },
        { provide: AuthRepository, useValue: { puedeVerProductos: get } },
        {
          provide: CafeteriaFacade,
          useValue: { load: () => of(cafeterias.map((id) => ({ id }) as Cafeteria)) },
        },
        { provide: TokenStorageService, useValue: { get: () => null } },
      ],
    });
    const raw = TestBed.runInInjectionContext(() => negocioHomeGuard(route, state));
    const result = isObservable(raw) ? await firstValueFrom(raw) : raw;
    const router = TestBed.inject(Router);
    return {
      result: result instanceof UrlTree ? router.serializeUrl(result) : result,
      loadCurrentUser,
      get,
    };
  }

  const encargado = (cafeteriaId?: string): User => ({
    id: 'u-1',
    email: 'a@b.mx',
    role: 'AdminCafeteria',
    ...(cafeteriaId ? { cafeteriaId } : {}),
  });

  it('deja pasar a otros roles sin consultar /me', async () => {
    const { result, loadCurrentUser, get } = await run('Alumno', null);
    expect(result).toBe(true);
    expect(loadCurrentUser).not.toHaveBeenCalled();
    expect(get).not.toHaveBeenCalled();
  });

  it('manda al encargado a /negocio/{id} sin buscar si ya conoce su cafetería', async () => {
    const { result, get } = await run('AdminCafeteria', encargado('c-1'));
    expect(result).toBe('/negocio/c-1');
    expect(get).not.toHaveBeenCalled();
  });

  it('sin cafetería conocida la busca y lo manda a su panel', async () => {
    const { result } = await run('AdminCafeteria', encargado(), { status: { 'c-a': 403 } });
    expect(result).toBe('/negocio/c-b');
  });

  it('tras recargar consulta /me y usa su cafetería sin buscar', async () => {
    const { result, loadCurrentUser, get } = await run('AdminCafeteria', null, {
      me$: of(encargado('c-2')),
    });
    expect(loadCurrentUser).toHaveBeenCalledOnce();
    expect(result).toBe('/negocio/c-2');
    expect(get).not.toHaveBeenCalled();
  });

  it('si /me falla igual busca la cafetería', async () => {
    const { result } = await run('AdminCafeteria', null, {
      me$: throwError(() => ({ status: 500 })),
      status: { 'c-a': 403 },
    });
    expect(result).toBe('/negocio/c-b');
  });

  it('si ninguna cafetería es suya manda a /negocio', async () => {
    const { result } = await run('AdminCafeteria', encargado(), {
      status: { 'c-a': 403, 'c-b': 403 },
    });
    expect(result).toBe('/negocio');
  });

  it('si la búsqueda falla manda a /negocio', async () => {
    const { result } = await run('AdminCafeteria', encargado(), { status: { 'c-a': 500 } });
    expect(result).toBe('/negocio');
  });
});

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { EMPTY, Observable, firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { User, UserRole } from '@features/auth/domain/models/user.model';
import { cafeteriaDelEncargadoResolver, negocioHomeGuard, roleGuard } from './auth.guard';

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

// CL-Sprint4 28/10/2026: HU-07B. El encargado nunca ve el inicio del alumno: va a /mi-negocio
// (sin id en la URL)
describe('negocioHomeGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/' } as RouterStateSnapshot;

  function run(role: UserRole) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthFacade,
          useValue: { hasRole: (...roles: UserRole[]) => roles.includes(role) },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() => negocioHomeGuard(route, state));
    return result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;
  }

  it('deja pasar a otros roles', () => {
    expect(run('Alumno')).toBe(true);
  });

  it('manda al encargado a /mi-negocio', () => {
    expect(run('AdminCafeteria')).toBe('/mi-negocio');
  });
});

// CL-Sprint4 28/10/2026: HU-07B. CL-Sprint5 13/11/2026: la cafetería sale de la sesión o de /me (sin la
// búsqueda TEMPORAL de Sprint4); si no viene, a /negocio.
describe('cafeteriaDelEncargadoResolver', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/mi-negocio' } as RouterStateSnapshot;

  async function run(user: User | null, me$: Observable<User> = EMPTY) {
    const loadCurrentUser = vi.fn(() => me$);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: { user: () => user, loadCurrentUser } },
      ],
    });
    const raw = TestBed.runInInjectionContext(() => cafeteriaDelEncargadoResolver(route, state));
    const result = isObservable(raw) ? await firstValueFrom(raw) : raw;
    return {
      result:
        result instanceof RedirectCommand
          ? `redirect:${TestBed.inject(Router).serializeUrl(result.redirectTo as UrlTree)}`
          : result,
      loadCurrentUser,
    };
  }

  const encargado = (cafeteriaId?: string): User => ({
    id: 'u-1',
    email: 'a@b.mx',
    role: 'AdminCafeteria',
    name: 'Encargada',
    ...(cafeteriaId ? { cafeteriaId } : {}),
  });

  it('da la cafetería de la sesión sin consultar /me', async () => {
    const { result, loadCurrentUser } = await run(encargado('c-1'));
    expect(result).toBe('c-1');
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('tras recargar consulta /me y usa su cafetería', async () => {
    const { result, loadCurrentUser } = await run(null, of(encargado('c-2')));
    expect(loadCurrentUser).toHaveBeenCalledOnce();
    expect(result).toBe('c-2');
  });

  it('si la sesión no trae cafetería redirige a /negocio', async () => {
    expect((await run(encargado())).result).toBe('redirect:/negocio');
  });

  it('si /me falla redirige a /negocio', async () => {
    const { result } = await run(null, throwError(() => ({ status: 500 })));
    expect(result).toBe('redirect:/negocio');
  });
});

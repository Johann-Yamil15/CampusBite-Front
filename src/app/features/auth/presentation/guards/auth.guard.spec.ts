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

// CL-Sprint4 28/10/2026: HU-07B. El encargado con cafetería conocida va directo a su panel
describe('negocioHomeGuard', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/' } as RouterStateSnapshot;

  async function run(role: UserRole, user: User | null, me$: Observable<User> = EMPTY) {
    const loadCurrentUser = vi.fn(() => me$);
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
      ],
    });
    const raw = TestBed.runInInjectionContext(() => negocioHomeGuard(route, state));
    const result = isObservable(raw) ? await firstValueFrom(raw) : raw;
    const router = TestBed.inject(Router);
    return {
      result: result instanceof UrlTree ? router.serializeUrl(result) : result,
      loadCurrentUser,
    };
  }

  const encargado = (cafeteriaId?: string): User => ({
    id: 'u-1',
    email: 'a@b.mx',
    role: 'AdminCafeteria',
    ...(cafeteriaId ? { cafeteriaId } : {}),
  });

  it('deja pasar a otros roles sin consultar /me', async () => {
    const { result, loadCurrentUser } = await run('Alumno', null);
    expect(result).toBe(true);
    expect(loadCurrentUser).not.toHaveBeenCalled();
  });

  it('manda al encargado a /negocio/{id} si ya conoce su cafetería', async () => {
    expect((await run('AdminCafeteria', encargado('c-1'))).result).toBe('/negocio/c-1');
  });

  it('deja pasar al encargado sin cafetería (el backend aún no la manda)', async () => {
    expect((await run('AdminCafeteria', encargado())).result).toBe(true);
  });

  it('tras recargar consulta /me y usa su cafetería', async () => {
    const { result, loadCurrentUser } = await run('AdminCafeteria', null, of(encargado('c-2')));
    expect(loadCurrentUser).toHaveBeenCalledOnce();
    expect(result).toBe('/negocio/c-2');
  });

  it('si /me falla deja pasar al inicio', async () => {
    expect(
      (
        await run(
          'AdminCafeteria',
          null,
          throwError(() => ({ status: 500 })),
        )
      ).result,
    ).toBe(true);
  });
});

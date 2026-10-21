import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { AuthFacade } from '@features/auth/application/auth.facade';
import { UserRole } from '@features/auth/domain/models/user.model';
import { roleGuard } from './auth.guard';

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

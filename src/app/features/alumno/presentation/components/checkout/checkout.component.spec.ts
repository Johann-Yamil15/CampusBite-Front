import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { vi } from 'vitest';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_CAFETERIA, DEMO_PRODUCTO } from '@core/mock/demo-db';
import { AuthFacade } from '@features/auth';
import { CatalogoFacade, provideCatalogo } from '@features/catalogo';
import { MisPedidosFacade, provideOrdenes } from '@features/ordenes';
import { providePerfil } from '@features/alumno/alumno.providers';
import { CarritoStore } from '@features/alumno/application/carrito.store';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import { CarritoUiService } from '@features/alumno/presentation/carrito-ui.service';
import { CheckoutComponent, aIsoConOffset } from './checkout.component';

/**
 * CL-Sprint5 11/11/2026: checkout sin Angular Material (etapa 5). Solo se fija el reloj (Date) para que
 * los horarios no dependan de la hora en que corran las pruebas; los timers siguen siendo reales.
 */
describe('CheckoutComponent', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let el: HTMLElement;
  let carrito: CarritoStore;

  async function abrir(
    hora: [number, number],
    idCafeteria: string = DEMO_CAFETERIA.central,
    idProducto: string = DEMO_PRODUCTO.sandwich,
    antes?: () => Promise<void>,
  ) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 11, hora[0], hora[1]));
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [provideRouter([]), provideCatalogo(), provideOrdenes(), providePerfil(),
        { provide: AuthFacade, useValue: { user: signal(null) } },
        { provide: MOCK_LATENCIA_MS, useValue: 0 },
      ],
    }).compileComponents();
    await firstValueFrom(TestBed.inject(CatalogoFacade).cargar());
    await antes?.();
    carrito = TestBed.inject(CarritoStore);
    carrito.vaciar();
    carrito.agregar({ idProducto, producto: 'Platillo', precio: 55, cantidad: 2, imagenUrl: null, idCafeteria, cafeteria: 'Demo' });
    fixture = TestBed.createComponent(CheckoutComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  }

  afterEach(() => vi.useRealTimers());

  const metodos = () => [...el.querySelectorAll('.co-metodo strong')].map((n) => n.textContent!.trim());
  const pedir = () => el.querySelector<HTMLButtonElement>('.co-acciones .cb-btn--primary')!;

  it('ofrece horarios de hoy con "Lo antes posible" elegido', async () => {
    await abrir([12, 0]);
    const horas = [...el.querySelectorAll('.co-hora')];
    expect(horas.length).toBeGreaterThan(1);
    expect(horas[0].textContent).toContain('Lo antes posible');
    expect(horas[0].getAttribute('aria-checked')).toBe('true');
    // Cafetería Central prepara en ~10 min: 12:00 + 10 = 12:10
    expect(horas[0].textContent).toContain('12:10');
  });

  it('solo muestra los métodos que acepta la cafetería', async () => {
    await abrir([12, 0]);
    expect(metodos()).toEqual(['Efectivo', 'Tarjeta', 'Transferencia']);
    fixture.destroy();
    TestBed.resetTestingModule();
    await abrir([9, 0], DEMO_CAFETERIA.terraza, DEMO_PRODUCTO.chilaquiles);
    expect(metodos()).toEqual(['Efectivo']);
  });

  it('confirmar crea la orden, vacía el carrito y lleva a la confirmación', async () => {
    await abrir([12, 0]);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    [...el.querySelectorAll<HTMLButtonElement>('.co-metodo')][1].click(); // Tarjeta
    await fixture.whenStable();
    pedir().click();
    await fixture.whenStable();

    const orden = TestBed.inject(MisPedidosFacade).ordenes()[0];
    expect(orden).toMatchObject({ metodo: 'tarjeta', estado: 'confirmada' });
    expect(carrito.isEmpty()).toBe(true);
    expect(TestBed.inject(CarritoUiService).checkoutAbierto()).toBe(false);
    expect(navegar).toHaveBeenCalledWith(['/pedidos', orden.idOrden, 'confirmado']);
  });

  it('si la cafetería ya no alcanza a preparar hoy, lo dice y no deja pedir', async () => {
    await abrir([16, 58]); // Central cierra a las 17:00
    expect(el.querySelector('.co-aviso')!.textContent).toContain('ya no recibe pedidos por hoy');
    expect(pedir().disabled).toBe(true);
  });

  // CL-Sprint5 11/11/2026 (etapa 8)
  it('arranca con el método preferido del perfil y marca el punto frecuente', async () => {
    localStorage.clear();
    await abrir([12, 0], DEMO_CAFETERIA.central, DEMO_PRODUCTO.sandwich, async () => {
      const perfil = TestBed.inject(PerfilFacade);
      await firstValueFrom(perfil.cargar());
      await firstValueFrom(perfil.guardarPreferencias({ metodoPago: 'transferencia', idCafeteriaFrecuente: DEMO_CAFETERIA.central }));
    });
    const elegido = el.querySelector('.co-metodo[aria-checked="true"]')!;
    expect(elegido.textContent).toContain('Transferencia');
    expect(elegido.textContent).toContain('tu preferido');
    expect(el.querySelector('.co-frecuente')!.textContent).toContain('Tu punto frecuente');
    localStorage.clear();
  });

  it('manda la hora con el offset local', () => {
    expect(aIsoConOffset(new Date(2026, 10, 11, 13, 5))).toMatch(/^2026-11-11T13:05:00[+-]\d{2}:\d{2}$/);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { provideCatalogo } from '@features/catalogo';
import { InicioPage } from './inicio.page';

// CL-Sprint5 11/11/2026: con el catálogo mock (sin latencia) el inicio ya muestra las cafeterías
describe('InicioPage', () => {
  let fixture: ComponentFixture<InicioPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioPage],
      providers: [provideCatalogo(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioPage);
    await fixture.whenStable();
  });

  it('muestra una tarjeta por cafetería del menú', () => {
    expect(fixture.nativeElement.querySelectorAll('app-negocio-card').length).toBeGreaterThan(0);
  });
});

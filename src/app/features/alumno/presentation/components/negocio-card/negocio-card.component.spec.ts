// FB-Sprint4 01/11/2026: Pruebas de la tarjeta del negocio con sus productos.
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NegocioCardComponent } from './negocio-card.component';
import { MenuCafeteria } from '@features/catalogo';

describe('NegocioCardComponent', () => {
  let component: NegocioCardComponent;
  let fixture: ComponentFixture<NegocioCardComponent>;

  const negocio: MenuCafeteria = {
    idCafeteria: 'c1', cafeteria: 'Cafetería Central', esDelCampus: true,
    puntoEntrega: 'Edificio A', metodosPago: ['efectivo', 'tarjeta'],
    productos: [{ idProducto: 'p1', producto: 'Latte Helado', categoria: null, descripcion: null, precio: 38, imagenUrl: null }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NegocioCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NegocioCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('negocio', negocio);
    await fixture.whenStable();
  });

  it('muestra el nombre y los métodos de pago', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(component).toBeTruthy();
    expect(el.querySelector('.negocio-nombre')?.textContent).toContain('Cafetería Central');
    expect(el.textContent).toContain('efectivo, tarjeta');
  });
});

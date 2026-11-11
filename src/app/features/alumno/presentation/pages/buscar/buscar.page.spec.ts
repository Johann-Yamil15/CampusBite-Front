import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { provideCatalogo } from '@features/catalogo';
import { BuscarPage } from './buscar.page';

/** CL-Sprint5 11/11/2026: buscador con el catálogo mock (sin latencia), etapa 4. */
describe('BuscarPage', () => {
  let fixture: ComponentFixture<BuscarPage>;
  let el: HTMLElement;

  const precios = () =>
    [...el.querySelectorAll('app-platillo-card .cb-precio')].map((n) =>
      Number(n.textContent!.replace(/[^\d.]/g, '')),
    );
  const nombres = () =>
    [...el.querySelectorAll('app-platillo-card .pc-nombre-btn')].map((n) => n.textContent!.trim());
  const chip = (texto: string) =>
    [...el.querySelectorAll<HTMLButtonElement>('.cb-chip')].find((b) => b.textContent!.trim() === texto)!;

  async function abrir(params: Record<string, string> = {}): Promise<void> {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [BuscarPage],
      providers: [provideRouter([]), provideCatalogo(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    fixture = TestBed.createComponent(BuscarPage);
    el = fixture.nativeElement;
    for (const [k, v] of Object.entries(params)) fixture.componentRef.setInput(k, v);
    await fixture.whenStable();
  }

  it('sin query params (el router los pone en undefined) funciona igual', async () => {
    const sinParams = Object.fromEntries(
      ['q', 'categoria', 'cafeteria', 'precio', 'tiempo', 'calificacion', 'dieta', 'abiertas', 'orden'].map(
        (k) => [k, undefined],
      ),
    ) as unknown as Record<string, string>;
    await abrir(sinParams);
    expect(el.querySelector<HTMLInputElement>('.bu-caja input')!.value).toBe('');
    expect(el.querySelectorAll('app-platillo-card').length).toBe(12);
  });

  it('sin criterios muestra los 12 platillos del catálogo demo', async () => {
    await abrir();
    expect(el.querySelector('.bu-conteo')!.textContent).toContain('12');
    expect(el.querySelectorAll('app-platillo-card').length).toBe(12);
  });

  it('lee los filtros de la URL (precio y orden)', async () => {
    await abrir({ precio: '40', orden: 'precio_asc' });
    // Abiertas primero, y dentro de ellas de menor a mayor precio; todo a $40 o menos
    expect(precios().every((p) => p <= 40)).toBe(true);
    expect(el.querySelector('.bu-pildora')!.textContent).toContain('Hasta $40');
  });

  it('el texto de la barra superior (?q=) busca sin acentos', async () => {
    await abrir({ q: 'cafe' });
    expect(nombres()).toContain('Café Americano');
    expect(el.querySelector<HTMLInputElement>('.bu-caja input')!.value).toBe('cafe');
  });

  it('busca también en los ingredientes', async () => {
    await abrir({ q: 'pesto' });
    expect(nombres()).toEqual(['Panini Caprese']);
  });

  it('la dieta filtra y aparece como pastilla que se quita', async () => {
    await abrir();
    chip('Sin gluten').click();
    await fixture.whenStable();
    const conDieta = nombres();
    expect(conDieta).toContain('Bowl de Pollo');
    expect(conDieta).not.toContain('Hamburguesa Clásica');

    el.querySelector<HTMLButtonElement>('.bu-pildora')!.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('app-platillo-card').length).toBe(12);
  });

  it('sin resultados ofrece quitar filtros y búsqueda', async () => {
    await abrir({ q: 'sushi' });
    expect(el.textContent).toContain('No encontramos «sushi»');

    el.querySelector<HTMLButtonElement>('.bu-vacio .cb-btn--primary')!.click();
    await fixture.whenStable();
    expect(el.querySelectorAll('app-platillo-card').length).toBe(12);
  });

  it('Enter guarda la búsqueda en recientes', async () => {
    await abrir();
    const input = el.querySelector<HTMLInputElement>('.bu-caja input')!;
    input.value = 'latte';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(JSON.parse(localStorage.getItem('cb.busquedas.recientes')!)).toEqual(['latte']);
    expect(nombres()).toEqual(['Latte Helado']);
  });
});

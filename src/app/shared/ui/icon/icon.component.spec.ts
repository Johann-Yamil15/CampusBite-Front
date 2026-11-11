import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

/** CL-Sprint5 11/11/2026: decorativo por defecto; con etiqueta se anuncia como imagen. */
describe('IconComponent', () => {
  async function crear(entradas: Record<string, unknown>): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [IconComponent] }).compileComponents();
    const fixture = TestBed.createComponent(IconComponent);
    for (const [k, v] of Object.entries(entradas)) fixture.componentRef.setInput(k, v);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('sin etiqueta queda oculto al lector de pantalla y usa trazo', async () => {
    const el = await crear({ nombre: 'buscar' });
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('svg')!.getAttribute('stroke')).toBe('currentColor');
  });

  it('con etiqueta es una imagen con nombre; los rellenos usan fill', async () => {
    const el = await crear({ nombre: 'estrella', etiqueta: 'Favorito' });
    expect(el.getAttribute('aria-hidden')).toBeNull();
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Favorito');
    expect(el.querySelector('svg')!.getAttribute('fill')).toBe('currentColor');
  });
});

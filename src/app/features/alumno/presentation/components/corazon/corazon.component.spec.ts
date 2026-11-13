import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { MOCK_LATENCIA_MS } from '@core/mock/mock-backend';
import { DEMO_PRODUCTO } from '@core/mock/demo-db';
import { ToastService } from '@shared/ui/toast/toast.service';
import { provideFavoritos } from '@features/alumno/alumno.providers';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { CorazonComponent } from './corazon.component';

/** Dos corazones del mismo platillo, como en el inicio y en Favoritos a la vez. */
@Component({
  imports: [CorazonComponent],
  template: `
    <span id="a"><app-corazon tipo="platillo" [id]="idProducto" nombre="Hamburguesa" /></span>
    <span id="b"><app-corazon tipo="platillo" [id]="idProducto" nombre="Hamburguesa" variante="etiqueta" /></span>
  `,
})
class DosCorazones {
  idProducto = DEMO_PRODUCTO.hamburguesa;
}

/** CL-Sprint5 11/11/2026 (etapa 7): corazón de favoritos sincronizado y con "Deshacer". */
describe('CorazonComponent', () => {
  let fixture: ComponentFixture<DosCorazones>;
  let el: HTMLElement;
  let toasts: ToastService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DosCorazones],
      providers: [provideFavoritos(), { provide: MOCK_LATENCIA_MS, useValue: 0 }],
    }).compileComponents();
    await firstValueFrom(TestBed.inject(FavoritosFacade).cargar());
    toasts = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(DosCorazones);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  const boton = (id: string) => el.querySelector<HTMLButtonElement>(`#${id} button`)!;

  it('al guardar en uno, se llena en todos, late y avisa', async () => {
    expect(boton('a').getAttribute('aria-pressed')).toBe('false');
    expect(boton('a').getAttribute('aria-label')).toBe('Guardar Hamburguesa en favoritos');
    boton('a').click();
    await fixture.whenStable();
    expect(boton('a').getAttribute('aria-pressed')).toBe('true');
    expect(boton('a').classList).toContain('late');
    expect(boton('b').getAttribute('aria-pressed')).toBe('true');
    expect(boton('b').textContent).toContain('Guardada');
    expect(toasts.toasts().at(-1)!.text).toBe('Hamburguesa se guardó en tus favoritos.');
  });

  it('al quitar avisa con "Deshacer", que lo vuelve a guardar', async () => {
    boton('b').click();
    await fixture.whenStable();
    boton('b').click();
    await fixture.whenStable();
    expect(boton('a').getAttribute('aria-pressed')).toBe('false');
    const aviso = toasts.toasts().at(-1)!;
    expect(aviso.text).toBe('Hamburguesa salió de tus favoritos.');
    expect(aviso.accion!.etiqueta).toBe('Deshacer');

    toasts.accionar(aviso.id);
    await fixture.whenStable();
    expect(boton('a').getAttribute('aria-pressed')).toBe('true');
    expect(toasts.toasts().at(-1)!.text).toBe('Hamburguesa volvió a tus favoritos.');
  });
});

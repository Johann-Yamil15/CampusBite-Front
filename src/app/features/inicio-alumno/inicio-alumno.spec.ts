import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioAlumnoComponent } from './inicio-alumno';

describe('InicioAlumnoComponent', () => {
  let component: InicioAlumnoComponent;
  let fixture: ComponentFixture<InicioAlumnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InicioAlumnoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InicioAlumnoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

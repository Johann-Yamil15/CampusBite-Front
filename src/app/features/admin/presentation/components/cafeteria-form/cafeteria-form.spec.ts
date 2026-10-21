import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CafeteriaForm } from './cafeteria-form';

describe('CafeteriaForm', () => {
  let component: CafeteriaForm;
  let fixture: ComponentFixture<CafeteriaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CafeteriaForm],
    }).compileComponents();

    fixture = TestBed.createComponent(CafeteriaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

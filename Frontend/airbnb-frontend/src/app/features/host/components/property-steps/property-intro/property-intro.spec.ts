import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyIntro } from './property-intro';

describe('PropertyIntro', () => {
  let component: PropertyIntro;
  let fixture: ComponentFixture<PropertyIntro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyIntro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyIntro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

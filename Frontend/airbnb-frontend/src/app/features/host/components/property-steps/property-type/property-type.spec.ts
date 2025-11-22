import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyType } from './property-type';

describe('PropertyType', () => {
  let component: PropertyType;
  let fixture: ComponentFixture<PropertyType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyType]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyType);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

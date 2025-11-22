import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyLocation } from './property-location';

describe('PropertyLocation', () => {
  let component: PropertyLocation;
  let fixture: ComponentFixture<PropertyLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

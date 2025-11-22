import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyReviews } from './property-reviews';

describe('PropertyReviews', () => {
  let component: PropertyReviews;
  let fixture: ComponentFixture<PropertyReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyReviews]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyReviews);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyCreationLayout } from './property-creation-layout';

describe('PropertyCreationLayout', () => {
  let component: PropertyCreationLayout;
  let fixture: ComponentFixture<PropertyCreationLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyCreationLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyCreationLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

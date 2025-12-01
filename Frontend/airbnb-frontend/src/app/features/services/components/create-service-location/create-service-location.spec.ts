import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceLocation } from './create-service-location';

describe('CreateServiceLocation', () => {
  let component: CreateServiceLocation;
  let fixture: ComponentFixture<CreateServiceLocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServiceLocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServiceLocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

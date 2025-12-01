import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceAvailability } from './create-service-availability';

describe('CreateServiceAvailability', () => {
  let component: CreateServiceAvailability;
  let fixture: ComponentFixture<CreateServiceAvailability>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServiceAvailability]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServiceAvailability);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

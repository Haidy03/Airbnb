import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceBookingModal } from './service-booking-modal';

describe('ServiceBookingModal', () => {
  let component: ServiceBookingModal;
  let fixture: ComponentFixture<ServiceBookingModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceBookingModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceBookingModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

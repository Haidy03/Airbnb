import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceCheckout } from './service-checkout';

describe('ServiceCheckout', () => {
  let component: ServiceCheckout;
  let fixture: ComponentFixture<ServiceCheckout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCheckout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceCheckout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

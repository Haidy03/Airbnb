import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostServiceDetails } from './host-service-details';

describe('HostServiceDetails', () => {
  let component: HostServiceDetails;
  let fixture: ComponentFixture<HostServiceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostServiceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostServiceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

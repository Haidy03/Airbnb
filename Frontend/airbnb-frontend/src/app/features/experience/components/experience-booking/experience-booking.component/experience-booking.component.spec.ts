import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperienceBookingComponent } from './experience-booking.component';

describe('ExperienceBookingComponent', () => {
  let component: ExperienceBookingComponent;
  let fixture: ComponentFixture<ExperienceBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceBookingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperienceBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

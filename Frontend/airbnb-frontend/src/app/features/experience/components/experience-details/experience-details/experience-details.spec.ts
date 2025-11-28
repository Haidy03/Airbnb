import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperienceDetails } from './experience-details';

describe('ExperienceDetails', () => {
  let component: ExperienceDetails;
  let fixture: ComponentFixture<ExperienceDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperienceDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

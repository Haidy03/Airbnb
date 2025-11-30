import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperienceReviewsComponent } from './experience-reviews.component';

describe('ExperienceReviewsComponent', () => {
  let component: ExperienceReviewsComponent;
  let fixture: ComponentFixture<ExperienceReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperienceReviewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperienceReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

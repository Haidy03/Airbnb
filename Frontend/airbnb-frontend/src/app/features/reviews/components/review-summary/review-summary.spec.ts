import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewSummaryComponent } from './review-summary';

describe('ReviewSummary', () => {
  let component: ReviewSummaryComponent;
  let fixture: ComponentFixture<ReviewSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReviewSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

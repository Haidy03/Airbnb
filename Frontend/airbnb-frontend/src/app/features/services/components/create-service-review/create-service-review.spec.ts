import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceReview } from './create-service-review';

describe('CreateServiceReview', () => {
  let component: CreateServiceReview;
  let fixture: ComponentFixture<CreateServiceReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServiceReview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServiceReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

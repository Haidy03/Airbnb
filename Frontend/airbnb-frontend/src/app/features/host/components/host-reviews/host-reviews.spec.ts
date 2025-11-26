import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostReviews } from './host-reviews';

describe('HostReviews', () => {
  let component: HostReviews;
  let fixture: ComponentFixture<HostReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostReviews]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostReviews);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

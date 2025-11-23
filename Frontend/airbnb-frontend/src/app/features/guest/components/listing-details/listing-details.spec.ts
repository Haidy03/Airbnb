import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListingDetails } from './listing-details';

describe('ListingDetails', () => {
  let component: ListingDetails;
  let fixture: ComponentFixture<ListingDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListingDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

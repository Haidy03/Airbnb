import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListingTypeModal } from './listing-type-modal';

describe('ListingTypeModal', () => {
  let component: ListingTypeModal;
  let fixture: ComponentFixture<ListingTypeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListingTypeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListingTypeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

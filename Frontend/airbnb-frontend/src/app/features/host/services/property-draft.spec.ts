import { TestBed } from '@angular/core/testing';

import { PropertyDraft } from './property-draft';

describe('PropertyDraft', () => {
  let service: PropertyDraft;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyDraft);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

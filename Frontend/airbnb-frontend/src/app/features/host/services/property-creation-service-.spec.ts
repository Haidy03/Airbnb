import { TestBed } from '@angular/core/testing';

import { PropertyCreationService } from './property-creation-service-';

describe('PropertyCreationService', () => {
  let service: PropertyCreationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyCreationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

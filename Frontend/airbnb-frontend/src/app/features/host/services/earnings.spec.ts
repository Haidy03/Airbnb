import { TestBed } from '@angular/core/testing';

import { Earnings } from './earnings';

describe('Earnings', () => {
  let service: Earnings;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Earnings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { HostStats } from './host-stats';

describe('HostStats', () => {
  let service: HostStats;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HostStats);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { CalendarErrorHandler } from './calendar-error-handler';

describe('CalendarErrorHandler', () => {
  let service: CalendarErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CalendarErrorHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

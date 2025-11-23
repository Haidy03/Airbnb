import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarSection } from './calendar-section';

describe('CalendarSection', () => {
  let component: CalendarSection;
  let fixture: ComponentFixture<CalendarSection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarSection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

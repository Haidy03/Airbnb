import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostCalendar } from './host-calendar';

describe('HostCalendar', () => {
  let component: HostCalendar;
  let fixture: ComponentFixture<HostCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

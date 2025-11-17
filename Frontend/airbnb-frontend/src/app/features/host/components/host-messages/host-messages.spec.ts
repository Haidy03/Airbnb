import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostMessages } from './host-messages';

describe('HostMessages', () => {
  let component: HostMessages;
  let fixture: ComponentFixture<HostMessages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostMessages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostMessages);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

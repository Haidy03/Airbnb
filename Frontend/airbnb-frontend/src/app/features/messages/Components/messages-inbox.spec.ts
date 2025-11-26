import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagesInbox } from './messages-inbox';

describe('MessagesInbox', () => {
  let component: MessagesInbox;
  let fixture: ComponentFixture<MessagesInbox>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessagesInbox]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessagesInbox);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

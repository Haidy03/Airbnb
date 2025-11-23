import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstantBook } from './instant-book';

describe('InstantBook', () => {
  let component: InstantBook;
  let fixture: ComponentFixture<InstantBook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstantBook]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstantBook);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

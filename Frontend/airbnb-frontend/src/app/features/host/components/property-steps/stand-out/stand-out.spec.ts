import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandOut } from './stand-out';

describe('StandOut', () => {
  let component: StandOut;
  let fixture: ComponentFixture<StandOut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandOut]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandOut);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

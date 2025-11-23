import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinishSetup } from './finish-setup';

describe('FinishSetup', () => {
  let component: FinishSetup;
  let fixture: ComponentFixture<FinishSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinishSetup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinishSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

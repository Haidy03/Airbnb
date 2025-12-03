import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HouseRules } from './house-rules';

describe('HouseRules', () => {
  let component: HouseRules;
  let fixture: ComponentFixture<HouseRules>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HouseRules]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HouseRules);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

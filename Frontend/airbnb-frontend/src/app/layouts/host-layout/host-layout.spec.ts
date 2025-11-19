import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostLayout } from './host-layout';

describe('HostLayout', () => {
  let component: HostLayout;
  let fixture: ComponentFixture<HostLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

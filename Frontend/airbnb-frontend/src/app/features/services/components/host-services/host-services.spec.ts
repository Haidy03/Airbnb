import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostServices } from './host-services';

describe('HostServices', () => {
  let component: HostServices;
  let fixture: ComponentFixture<HostServices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostServices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostServices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

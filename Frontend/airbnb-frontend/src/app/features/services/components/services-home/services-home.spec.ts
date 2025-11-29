import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesHome } from './services-home';

describe('ServicesHome', () => {
  let component: ServicesHome;
  let fixture: ComponentFixture<ServicesHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesHome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesHome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

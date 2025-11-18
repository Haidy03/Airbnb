import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Propertystatus } from './propertystatus';

describe('Propertystatus', () => {
  let component: Propertystatus;
  let fixture: ComponentFixture<Propertystatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Propertystatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Propertystatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

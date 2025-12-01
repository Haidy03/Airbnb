import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceTitle } from './create-service-title';

describe('CreateServiceTitle', () => {
  let component: CreateServiceTitle;
  let fixture: ComponentFixture<CreateServiceTitle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServiceTitle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServiceTitle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

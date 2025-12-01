import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceDescription } from './create-service-description';

describe('CreateServiceDescription', () => {
  let component: CreateServiceDescription;
  let fixture: ComponentFixture<CreateServiceDescription>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServiceDescription]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServiceDescription);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

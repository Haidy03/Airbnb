import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServicePrice } from './create-service-price';

describe('CreateServicePrice', () => {
  let component: CreateServicePrice;
  let fixture: ComponentFixture<CreateServicePrice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServicePrice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServicePrice);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServicePhotos } from './create-service-photos';

describe('CreateServicePhotos', () => {
  let component: CreateServicePhotos;
  let fixture: ComponentFixture<CreateServicePhotos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateServicePhotos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateServicePhotos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

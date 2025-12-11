import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminServicesComponent } from './admin-services';

describe('AdminServices', () => {
  let component: AdminServicesComponent;
  let fixture: ComponentFixture<AdminServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminServicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

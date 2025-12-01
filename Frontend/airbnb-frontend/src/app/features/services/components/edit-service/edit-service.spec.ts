import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditService } from './edit-service';

describe('EditService', () => {
  let component: EditService;
  let fixture: ComponentFixture<EditService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

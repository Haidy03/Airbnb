import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExperiencesHomeComponent } from './experiences-home.component';

describe('ExperiencesHomeComponent', () => {
  let component: ExperiencesHomeComponent;
  let fixture: ComponentFixture<ExperiencesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExperiencesHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExperiencesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

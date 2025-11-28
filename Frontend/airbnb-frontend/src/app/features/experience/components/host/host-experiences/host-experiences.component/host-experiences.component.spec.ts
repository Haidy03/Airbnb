import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostExperiencesComponent } from './host-experiences.component';

describe('HostExperiencesComponent', () => {
  let component: HostExperiencesComponent;
  let fixture: ComponentFixture<HostExperiencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostExperiencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HostExperiencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

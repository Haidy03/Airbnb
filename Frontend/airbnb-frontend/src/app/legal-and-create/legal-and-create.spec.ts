import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalAndCreate } from './legal-and-create';

describe('LegalAndCreate', () => {
  let component: LegalAndCreate;
  let fixture: ComponentFixture<LegalAndCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalAndCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LegalAndCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

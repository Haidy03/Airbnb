import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyEditor } from './property-editor';

describe('PropertyEditor', () => {
  let component: PropertyEditor;
  let fixture: ComponentFixture<PropertyEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

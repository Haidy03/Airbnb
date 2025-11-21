import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchMap } from './search-map';

describe('SearchMap', () => {
  let component: SearchMap;
  let fixture: ComponentFixture<SearchMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

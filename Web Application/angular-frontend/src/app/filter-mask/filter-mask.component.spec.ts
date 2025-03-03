import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterMaskComponent } from './filter-mask.component';

describe('FilterMaskComponent', () => {
  let component: FilterMaskComponent;
  let fixture: ComponentFixture<FilterMaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterMaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterMaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

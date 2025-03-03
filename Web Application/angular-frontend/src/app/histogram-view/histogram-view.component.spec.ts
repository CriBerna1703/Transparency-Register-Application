import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistogramViewComponent } from './histogram-view.component';

describe('HistogramViewComponent', () => {
  let component: HistogramViewComponent;
  let fixture: ComponentFixture<HistogramViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistogramViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistogramViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

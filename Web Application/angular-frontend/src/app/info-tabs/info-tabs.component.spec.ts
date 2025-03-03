import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoTabsComponent } from './info-tabs.component';

describe('InfoTabsComponent', () => {
  let component: InfoTabsComponent;
  let fixture: ComponentFixture<InfoTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

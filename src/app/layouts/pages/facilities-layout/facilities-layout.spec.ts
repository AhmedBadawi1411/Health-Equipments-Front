import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacilitiesLayout } from './facilities-layout';

describe('FacilitiesLayout', () => {
  let component: FacilitiesLayout;
  let fixture: ComponentFixture<FacilitiesLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacilitiesLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacilitiesLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

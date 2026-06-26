import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpatialAnalysis } from './spatial-analysis';

describe('SpatialAnalysis', () => {
  let component: SpatialAnalysis;
  let fixture: ComponentFixture<SpatialAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpatialAnalysis]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpatialAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

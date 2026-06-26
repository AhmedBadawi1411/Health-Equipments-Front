import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeedsLayout } from './needs-layout';

describe('NeedsLayout', () => {
  let component: NeedsLayout;
  let fixture: ComponentFixture<NeedsLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeedsLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NeedsLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

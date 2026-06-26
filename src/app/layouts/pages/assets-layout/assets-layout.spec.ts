import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsLayout } from './assets-layout';

describe('AssetsLayout', () => {
  let component: AssetsLayout;
  let fixture: ComponentFixture<AssetsLayout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsLayout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

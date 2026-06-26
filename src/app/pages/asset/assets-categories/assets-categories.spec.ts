import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsCategories } from './assets-categories';

describe('AssetsCategories', () => {
  let component: AssetsCategories;
  let fixture: ComponentFixture<AssetsCategories>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsCategories]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsCategories);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssetsManufacturers } from './assets-manufacturers';

describe('AssetsManufacturers', () => {
  let component: AssetsManufacturers;
  let fixture: ComponentFixture<AssetsManufacturers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsManufacturers]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetsManufacturers);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

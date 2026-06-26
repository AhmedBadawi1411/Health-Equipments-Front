import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWithLabel } from './select-with-label';

describe('SelectWithLabel', () => {
  let component: SelectWithLabel;
  let fixture: ComponentFixture<SelectWithLabel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectWithLabel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectWithLabel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

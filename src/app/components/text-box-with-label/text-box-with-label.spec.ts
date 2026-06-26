import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextBoxWithLabel } from './text-box-with-label';

describe('TextBoxWithLabel', () => {
  let component: TextBoxWithLabel;
  let fixture: ComponentFixture<TextBoxWithLabel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextBoxWithLabel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextBoxWithLabel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

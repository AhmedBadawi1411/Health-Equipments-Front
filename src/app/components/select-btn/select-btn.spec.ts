import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectBtn } from './select-btn';

describe('SelectBtn', () => {
  let component: SelectBtn;
  let fixture: ComponentFixture<SelectBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectBtn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

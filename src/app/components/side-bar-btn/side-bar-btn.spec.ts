import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideBarBtn } from './side-bar-btn';

describe('SideBarBtn', () => {
  let component: SideBarBtn;
  let fixture: ComponentFixture<SideBarBtn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideBarBtn]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SideBarBtn);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

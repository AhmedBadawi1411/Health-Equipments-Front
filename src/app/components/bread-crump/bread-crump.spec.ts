import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreadCrump } from './bread-crump';

describe('BreadCrump', () => {
  let component: BreadCrump;
  let fixture: ComponentFixture<BreadCrump>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadCrump]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BreadCrump);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

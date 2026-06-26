import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeedRequests } from './need-requests';

describe('NeedRequests', () => {
  let component: NeedRequests;
  let fixture: ComponentFixture<NeedRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeedRequests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NeedRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

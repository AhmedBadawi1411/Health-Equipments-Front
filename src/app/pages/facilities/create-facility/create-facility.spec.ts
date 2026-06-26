import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateFacility } from './create-facility';

describe('CreateFacility', () => {
  let component: CreateFacility;
  let fixture: ComponentFixture<CreateFacility>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateFacility]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateFacility);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

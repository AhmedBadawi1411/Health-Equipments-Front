import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNeed } from './create-need';

describe('CreateNeed', () => {
  let component: CreateNeed;
  let fixture: ComponentFixture<CreateNeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNeed]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAsset } from './create-asset';

describe('CreateAsset', () => {
  let component: CreateAsset;
  let fixture: ComponentFixture<CreateAsset>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAsset]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAsset);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

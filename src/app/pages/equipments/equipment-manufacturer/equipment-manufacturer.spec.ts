import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipmentManufacturer } from './equipment-manufacturer';

describe('EquipmentManufacturer', () => {
  let component: EquipmentManufacturer;
  let fixture: ComponentFixture<EquipmentManufacturer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipmentManufacturer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipmentManufacturer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

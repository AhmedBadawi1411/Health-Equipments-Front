import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { EquipmentNeedsComponent } from '../equipment-needs/equipment-needs';
import { ConsumablesNeedsComponent } from '../consumables-needs/consumables-needs';
import { HealthcareService } from '../../../services/healthcare.service';

@Component({
  selector: 'app-needs-wrapper',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    EquipmentNeedsComponent,
    ConsumablesNeedsComponent,
  ],
  template: `
    <!-- Tabs: احتياج الأجهزة / احتياج المستلزمات -->
    <div class="card p-3! mb-0">
      <div class="flex flex-row gap-2">
        <button
          pButton
          [text]="activeTab() !== 'equipment'"
          severity="primary"
          icon="pi pi-microchip"
          label="احتياج المعدات الأجهزة الطبية"
          (click)="activeTab.set('equipment')"
          class="h-10!"
        ></button>
        <button
          pButton
          [text]="activeTab() !== 'consumables'"
          severity="primary"
          icon="pi pi-shopping-cart"
          label="احتياج المستلزمات والمشغلات الطبية"
          (click)="activeTab.set('consumables')"
          class="h-10!"
        ></button>
      </div>
    </div>

    <!-- Equipment Needs Tab -->
    <div *ngIf="activeTab() === 'equipment'">
      <app-simple-equipment-needs></app-simple-equipment-needs>
    </div>

    <!-- Consumables Needs Tab -->
    <div *ngIf="activeTab() === 'consumables'">
      <app-simple-consumables-needs></app-simple-consumables-needs>
    </div>
  `,
})
export class NeedsWrapperComponent {
  constructor(public readonly healthcareService: HealthcareService) {}

  get activeTab() {
    return this.healthcareService.activeNeedTab;
  }
}

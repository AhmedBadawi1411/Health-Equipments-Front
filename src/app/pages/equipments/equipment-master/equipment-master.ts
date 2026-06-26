import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SectionHeader } from '../../../components/section-header/section-header';
import { AssetsHelperService } from '../../../services/assets-helpers';
import { AssetsService } from '../../../services/assets';

@Component({
  selector: 'app-equipment-master',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    Select,
    ToastModule,
    SectionHeader
  ],
  providers: [MessageService],
  templateUrl: './equipment-master.html',
  styleUrl: './equipment-master.css',
})
export class EquipmentMaster implements OnInit {
  // Form fields
  equipmentName = '';
  selectedCategory: any = null;
  selectedManufacturer: any = null;
  model = '';
  expectedLifeYears: number | null = null;

  // Search filter
  searchText = signal('');

  constructor(
    public readonly assetsHelper: AssetsHelperService,
    public readonly assetsService: AssetsService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.assetsHelper.loadCategories();
    this.assetsHelper.loadManufacturers();
    this.assetsService.loadAssetMaster();
  }

  categoryOptions = computed(() => {
    return this.assetsHelper.categories().map((c) => ({
      name: c.categoryName,
      value: c.categoryId,
    }));
  });

  manufacturerOptions = computed(() => {
    return this.assetsHelper.manufacturers().map((m) => ({
      name: m.manufacturerName,
      value: m.manufacturerId,
    }));
  });

  filteredEquipmentTypes = computed(() => {
    const list = this.assetsService.assetMaster() || [];
    const search = this.searchText().trim().toLowerCase();
    if (!search) return list;
    return list.filter((item) =>
      item.equipmentName.toLowerCase().includes(search) ||
      item.model?.toLowerCase().includes(search)
    );
  });

  onSubmit() {
    if (!this.equipmentName || !this.selectedCategory || !this.selectedManufacturer || !this.model) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    const payload = {
      equipmentName: this.equipmentName,
      categoryId: Number(this.selectedCategory),
      manufacturerId: Number(this.selectedManufacturer),
      model: this.model,
      expectedLifeYears: this.expectedLifeYears ? Number(this.expectedLifeYears) : undefined,
    };

    this.assetsService.createEquipmentMaster(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم حفظ نوع الجهاز بنجاح',
          });
          // Reset form
          this.equipmentName = '';
          this.selectedCategory = null;
          this.selectedManufacturer = null;
          this.model = '';
          this.expectedLifeYears = null;
          // Reload master list
          this.assetsService.loadAssetMaster();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: res.message || 'فشل في حفظ نوع الجهاز',
          });
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'حدث خطأ أثناء الاتصال بالخادم',
        });
      },
    });
  }
}

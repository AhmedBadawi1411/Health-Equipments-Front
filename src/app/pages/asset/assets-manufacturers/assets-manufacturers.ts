import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SectionHeader } from '../../../components/section-header/section-header';
import { AssetsHelperService } from '../../../services/assets-helpers';

@Component({
  selector: 'app-assets-manufacturers',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    SectionHeader
  ],
  providers: [MessageService],
  templateUrl: './assets-manufacturers.html',
  styleUrl: './assets-manufacturers.css',
})
export class AssetsManufacturers implements OnInit {
  manufacturerName = '';
  country = '';
  searchText = signal('');

  constructor(
    public readonly assetsHelper: AssetsHelperService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.assetsHelper.loadManufacturers();
  }

  filteredManufacturers = computed(() => {
    const list = this.assetsHelper.manufacturers() || [];
    const search = this.searchText().trim().toLowerCase();
    if (!search) return list;
    return list.filter((item) =>
      item.manufacturerName.toLowerCase().includes(search) ||
      (item.country && item.country.toLowerCase().includes(search))
    );
  });

  onSubmit() {
    if (!this.manufacturerName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى إدخال اسم الشركة المصنعة',
      });
      return;
    }

    const payload = {
      manufacturerName: this.manufacturerName.trim(),
      country: this.country.trim() || undefined
    };

    this.assetsHelper.createManufacturer(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم حفظ الشركة المصنعة بنجاح',
          });
          this.manufacturerName = '';
          this.country = '';
          this.assetsHelper.loadManufacturers(true);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: res.message || 'فشل في حفظ الشركة المصنعة',
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

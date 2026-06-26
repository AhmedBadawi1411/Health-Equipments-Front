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
  selector: 'app-assets-suppliers',
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
  templateUrl: './assets-suppliers.html',
  styleUrl: './assets-suppliers.css',
})
export class AssetsSuppliers implements OnInit {
  supplierName = '';
  contactPerson = '';
  mobile = '';
  email = '';
  searchText = signal('');

  constructor(
    public readonly assetsHelper: AssetsHelperService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.assetsHelper.loadSuppliers();
  }

  filteredSuppliers = computed(() => {
    const list = this.assetsHelper.suppliers() || [];
    const search = this.searchText().trim().toLowerCase();
    if (!search) return list;
    return list.filter((item) =>
      item.supplierName.toLowerCase().includes(search) ||
      (item.contactPerson && item.contactPerson.toLowerCase().includes(search)) ||
      (item.mobile && item.mobile.toLowerCase().includes(search)) ||
      (item.email && item.email.toLowerCase().includes(search))
    );
  });

  onSubmit() {
    if (!this.supplierName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى إدخال اسم المورد',
      });
      return;
    }

    const payload = {
      supplierName: this.supplierName.trim(),
      contactPerson: this.contactPerson.trim() || undefined,
      mobile: this.mobile.trim() || undefined,
      email: this.email.trim() || undefined
    };

    this.assetsHelper.createSupplier(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم حفظ بيانات المورد بنجاح',
          });
          this.supplierName = '';
          this.contactPerson = '';
          this.mobile = '';
          this.email = '';
          this.assetsHelper.loadSuppliers(true);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: res.message || 'فشل في حفظ المورد',
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

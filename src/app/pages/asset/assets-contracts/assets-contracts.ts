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

@Component({
  selector: 'app-assets-contracts',
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
  templateUrl: './assets-contracts.html',
  styleUrl: './assets-contracts.css',
})
export class AssetsContracts implements OnInit {
  selectedSupplier: any = null;
  contractNumber = '';
  startDate = '';
  endDate = '';
  searchText = signal('');

  constructor(
    public readonly assetsHelper: AssetsHelperService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.assetsHelper.loadSuppliers();
    this.assetsHelper.loadContracts();
  }

  supplierOptions = computed(() => {
    return this.assetsHelper.suppliers().map((s) => ({
      name: s.supplierName,
      value: s.supplierId,
    }));
  });

  filteredContracts = computed(() => {
    const list = this.assetsHelper.contracts() || [];
    const search = this.searchText().trim().toLowerCase();
    if (!search) return list;
    return list.filter((item) =>
      item.contractNumber.toLowerCase().includes(search) ||
      this.assetsHelper.suppliersMap().get(item.supplierId)?.toLowerCase().includes(search)
    );
  });

  onSubmit() {
    if (!this.selectedSupplier || !this.contractNumber.trim() || !this.startDate || !this.endDate) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    const payload = {
      supplierId: Number(this.selectedSupplier),
      contractNumber: this.contractNumber.trim(),
      startDate: this.startDate,
      endDate: this.endDate
    };

    this.assetsHelper.createContract(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم حفظ عقد الصيانة بنجاح',
          });
          this.selectedSupplier = null;
          this.contractNumber = '';
          this.startDate = '';
          this.endDate = '';
          this.assetsHelper.loadContracts(true);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: res.message || 'فشل في حفظ عقد الصيانة',
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

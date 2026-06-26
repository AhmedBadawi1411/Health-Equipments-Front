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
  selector: 'app-assets-categories',
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
  templateUrl: './assets-categories.html',
  styleUrl: './assets-categories.css',
})
export class AssetsCategories implements OnInit {
  categoryName = '';
  searchText = signal('');

  constructor(
    public readonly assetsHelper: AssetsHelperService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit() {
    this.assetsHelper.loadCategories();
  }

  filteredCategories = computed(() => {
    const list = this.assetsHelper.categories() || [];
    const search = this.searchText().trim().toLowerCase();
    if (!search) return list;
    return list.filter((item) =>
      item.categoryName.toLowerCase().includes(search)
    );
  });

  onSubmit() {
    if (!this.categoryName.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى إدخال اسم الفئة',
      });
      return;
    }

    this.assetsHelper.createCategory({ categoryName: this.categoryName.trim() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم حفظ الفئة العلمية بنجاح',
          });
          this.categoryName = '';
          this.assetsHelper.loadCategories(true);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: res.message || 'فشل في حفظ الفئة العلمية',
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

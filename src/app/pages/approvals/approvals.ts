import { Component, OnInit, ChangeDetectorRef, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HealthcareService, Facility } from '../../services/healthcare.service';
import { Dialog } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { AuthService } from '../../services/auth-service';
import { Menu } from 'primeng/menu';

import { ExcelService } from '../../services/excel.service';

@Component({
  selector: 'app-simple-approvals',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    TableModule,
    Button,
    Tag,
    InputTextModule,
    Select,
    Menu,
  ],
  templateUrl: './approvals.html',
  styleUrl: '../../shared/shared.css',
})
export class ApprovalsComponent implements OnInit {
  viewMode = signal<'list' | 'detail'>('list');
  selectedFacilityId: number | null = null;
  activeMenuItems: any[] = [];
  activeDetailMenuItems: any[] = [];

  openMenu(event: Event, menu: any, fac: Facility) {
    this.activeMenuItems = [
      {
        label: 'عرض بيانات الحصر',
        icon: 'pi pi-eye',
        command: () => {
          this.viewFacilityInventory(fac.id, fac.facilityName);
        }
      }
    ];

    if (fac.inventoryStatus !== 'NOT_STARTED') {
      this.activeMenuItems.push({
        label: 'استلام الحصر',
        icon: 'pi pi-check',
        disabled: fac.inventoryStatus === 'APPROVED',
        command: () => {
          this.approveInventory(fac.id);
        }
      });
      
      this.activeMenuItems.push({
        label: 'إرجاع للتعديل',
        icon: 'pi pi-times-circle',
        disabled: fac.inventoryStatus === 'REJECTED',
        command: () => {
          this.openRejectDialog(fac.id);
        }
      });

      this.activeMenuItems.push({
        label: 'إعادة تعيين الحالة',
        icon: 'pi pi-refresh',
        command: () => {
          this.resetInventory(fac.id);
        }
      });
    }

    menu.toggle(event);
  }

  openDetailMenu(event: Event, menu: any) {
    const facId = this.selectedFacilityId;
    if (!facId) return;

    this.activeDetailMenuItems = [
      {
        label: 'استلام الحصر بنجاح',
        icon: 'pi pi-check',
        command: () => {
          this.approveInventory(facId);
        }
      },
      {
        label: 'إرجاع للتعديل مع الملاحظات',
        icon: 'pi pi-times-circle',
        command: () => {
          this.openRejectDialog(facId);
        }
      },
      {
        label: 'إعادة تعيين حالة الحصر',
        icon: 'pi pi-refresh',
        command: () => {
          this.resetInventory(facId);
        }
      }
    ];

    menu.toggle(event);
  }

  facilities: Facility[] = [];
  filterSearch = '';
  filterStatus: string | null = null;

  statusOptions = [
    { name: 'لم يبدأ الحصر', value: 'NOT_STARTED' },
    { name: 'بانتظار الاستلام', value: 'PENDING_APPROVAL' },
    { name: 'تم استلامه', value: 'APPROVED' },
  ];

  toastMessage: { text: string; type: 'success' | 'error' | 'warning' } | null = null;

  constructor(
    private readonly healthcareService: HealthcareService,
    public readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef,
    private readonly excelService: ExcelService
  ) {}

  exportExcel() {
    const data = this.filteredFacilities;
    const headersMap = {
      id: 'ت',
      region: 'المنطقة',
      facilityName: 'اسم المرفق الصحي',
      facilityLevel: 'المستوى',
      bedCapacity: 'السعة السريرية',
      director: 'المدير المسؤول',
      inventoryStatus: 'حالة الطلب'
    };
    
    const statusLabels: Record<string, string> = {
      'NOT_STARTED': 'لم يبدأ الحصر',
      'PENDING_APPROVAL': 'بانتظار الاستلام',
      'APPROVED': 'تم استلامه'
    };

    const mappedData = data.map(item => ({
      ...item,
      inventoryStatus: statusLabels[item.inventoryStatus] || item.inventoryStatus
    }));

    this.excelService.exportToExcel(mappedData, 'سجل_الاستلامات_والحصر', headersMap, 'الاستلامات');
  }

  ngOnInit() {
    this.loadFacilities();
  }

  showToast(text: string, type: 'success' | 'error' | 'warning' = 'success') {
    setTimeout(() => {
      this.toastMessage = { text, type };
      this.cdr.detectChanges();
      setTimeout(() => {
        if (this.toastMessage?.text === text) {
          this.toastMessage = null;
          this.cdr.detectChanges();
        }
      }, 4000);
    });
  }

  loadFacilities() {
    this.healthcareService.getFacilities().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const user = this.authService.user();
          const roleName = (user?.role?.name || '').toLowerCase();
          const isAdmin = user?.roleId === '1' || roleName === 'admin' || roleName === 'مدير النظام' || roleName === 'مدير' || roleName.includes('admin') || user?.email === 'admin@admin.com';

          if (isAdmin) {
            this.facilities = res.data;
          } else {
            const allowedIds = (user?.facilityIds || []).map((id: any) => Number(id));
            this.facilities = res.data.filter((f: any) => allowedIds.includes(f.id));
          }
          this.cdr.detectChanges();
        }
      },
    });
  }

  get filteredFacilities(): Facility[] {
    let list = this.facilities;
    const search = this.filterSearch.trim().toLowerCase();
    if (search) {
      list = list.filter(f =>
        f.facilityName?.toLowerCase().includes(search) ||
        f.region?.toLowerCase().includes(search) ||
        f.director?.toLowerCase().includes(search)
      );
    }
    if (this.filterStatus) {
      list = list.filter(f => f.inventoryStatus === this.filterStatus);
    }
    return list;
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterStatus = null;
    this.cdr.detectChanges();
  }

  isViewDataModalOpen = false;
  facilityItems: any[] = [];
  selectedFacilityName = '';

  operationalStatusMap = new Map<string, { label: string; severity: 'success' | 'warn' | 'danger' | 'info' | 'secondary' }>([
    ['Fully Functional', { label: 'يعمل بكفاءة', severity: 'success' }],
    ['Functional & Needs Supplies', { label: 'يعمل ويحتاج مستلزمات', severity: 'info' }],
    ['Out of Service & Needs Maintenance', { label: 'خارج الخدمة ويحتاج صيانة', severity: 'danger' }],
    ['Functional but Inactive', { label: 'يعمل ولكنه غير نشط', severity: 'warn' }],
    ['Scrapped', { label: 'تالف ', severity: 'secondary' }]
  ]);

  isRejectDialogOpen = false;
  rejectNotes = '';
  selectedFacilityIdForReject = 0;
  lifecycleLogs: any[] = [];
  reviewNotesHistory: any[] = [];

  openRejectDialog(facId: number) {
    this.selectedFacilityIdForReject = facId;
    this.rejectNotes = '';
    this.isRejectDialogOpen = true;
    this.cdr.detectChanges();
  }

  confirmReject() {
    if (!this.rejectNotes.trim()) {
      this.showToast('يرجى كتابة ملاحظات المراجعة أولاً للتوضيح للمستخدم', 'warning');
      return;
    }
    this.healthcareService.updateFacilityStatus(this.selectedFacilityIdForReject, 'REJECTED', this.rejectNotes).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast('تم إرجاع الطلب للتعديل وإرسال الملاحظات للمستخدم بنجاح');
          this.isRejectDialogOpen = false;
          this.loadFacilities();
        }
      },
      error: () => this.showToast('فشل في إرجاع الطلب للتعديل', 'error'),
    });
  }

  viewFacilityInventory(facId: number, facName: string) {
    this.selectedFacilityId = facId;
    this.selectedFacilityName = facName;
    this.lifecycleLogs = [];
    this.reviewNotesHistory = [];

    // Load lifecycle logs & review notes
    this.healthcareService.getLifecycleLogs('INVENTORY', undefined, facId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.lifecycleLogs = res.data.logs;
          this.reviewNotesHistory = res.data.notes;
          this.cdr.detectChanges();
        }
      }
    });

    this.healthcareService.getInventory(facId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const allItems: any[] = [];
          for (const survey of res.data) {
            for (const item of (survey.items || [])) {
              allItems.push({
                ...item,
                surveyDate: survey.surveyDate,
                surveyType: survey.surveyType
              });
            }
          }
          this.facilityItems = allItems;
          this.viewMode.set('detail');
          this.cdr.detectChanges();
        }
      }
    });
  }

  goBackToList() {
    this.viewMode.set('list');
    this.selectedFacilityId = null;
    this.selectedFacilityName = '';
    this.facilityItems = [];
    this.lifecycleLogs = [];
    this.reviewNotesHistory = [];
    this.cdr.detectChanges();
  }

  exportFacilityItemsExcel() {
    if (!this.facilityItems || this.facilityItems.length === 0) return;
    const data = this.facilityItems;

    const mappedData = data.map(item => ({
      ...item,
      itemTypeLabel: item.itemType === 'supply' ? 'مستلزمات ومشغلات طبية' : 'معدات وأجهزة طبية',
      operationalStatusLabel: this.operationalStatusMap.get(item.operationalStatus)?.label || item.operationalStatus || '-'
    }));

    const headersMap = {
      itemTypeLabel: 'النوع',
      scientificName: 'الاسم العلمي',
      'department.departmentName': 'القسم',
      model: 'الموديل / الوحدة',
      serialNumber: 'الرقم التسلسلي / الكمية',
      manufacturer: 'الشركة المصنعة',
      supplier: 'الشركة الموردة',
      operationalStatusLabel: 'الحالة التشغيلية'
    };

    this.excelService.exportToExcel(
      mappedData, 
      `بيانات_حصر${this.selectedFacilityName}`, 
      headersMap, 
      'أجهزة ومستلزمات المرفق'
    );
  }

  approveInventory(facId: number) {
    this.healthcareService.approveInventory(facId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast('تم استلام حصر الأجهزة والتجهيزات الطبية للمرفق بنجاح');
          this.loadFacilities();
        }
      },
      error: () => this.showToast('فشل في استلام عملية الحصر للمرفق', 'error'),
    });
  }

  resetInventory(facId: number) {
    this.healthcareService.updateFacilityStatus(facId, 'NOT_STARTED').subscribe({
      next: (res: any) => {
        if (res.success) {
          this.showToast('تمت إعادة تعيين حالة الحصر للمرفق بنجاح');
          this.loadFacilities();
        }
      },
      error: () => this.showToast('فشل في إعادة تعيين حالة الحصر للمرفق', 'error'),
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('ar-LY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getFriendlyAction(act: string): string {
    const map: Record<string, string> = {
      'CREATE': 'إنشاء عملية حصر جديدة',
      'UPDATE': 'تحديث بيانات الحصر',
      'DELETE': 'حذف مسودة الحصر',
      'STATUS_CHANGE': 'تغيير حالة الطلب والاستلام',
      'SEND_NOTE': 'إرسال ملاحظة مراجعة',
    };
    return map[act] || act;
  }
}
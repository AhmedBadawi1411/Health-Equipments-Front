import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppEnvironment } from '../../../environment';
import { SectionHeader } from '../../../components/section-header/section-header';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule, Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tag } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ExcelService } from '../../../services/excel.service';
import { HealthcareService, NeedRequest, NeedItem, Facility, Department } from '../../../services/healthcare.service';
import { AuthService } from '../../../services/auth-service';
import { SelectWithLabel } from '../../../components/select-with-label/select-with-label';
import { TextBoxWithLabel } from '../../../components/text-box-with-label/text-box-with-label';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-simple-equipment-needs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SectionHeader,
    Select,
    TableModule,
    ButtonModule,
    Button,
    InputTextModule,
    IconField,
    InputIcon,
    Tag,
    ToastModule,
    SelectWithLabel,
    TextBoxWithLabel,
    Dialog,
  ],
  providers: [MessageService],
  templateUrl: './equipment-needs.html',
})
export class EquipmentNeedsComponent implements OnInit {
  viewMode = signal<'list' | 'create' | 'edit' | 'detail'>('list');

  // List View Variables
  requests: NeedRequest[] = [];
  selectedRequest: NeedRequest | null = null;
  loading = signal<boolean>(false);

  // Filters
  filterSearch = '';
  filterFacilityId: any = null;
  filterEditRequested = false;
  isInventoryMismatchOpen = false;
  mismatchItems: any[] = [];

  storedDevices: any[] = [];
  isAddStoredDeviceDialogOpen = false;
  newStoredDeviceArabic = '';
  newStoredDeviceEnglish = '';

  get filteredStoredDevices() {
    const term = (this.currentItem.scientificName || '').trim().toLowerCase();
    if (!term) return this.storedDevices;
    return this.storedDevices.filter(d => 
      (d.arabicName && d.arabicName.toLowerCase().includes(term)) ||
      (d.englishName && d.englishName.toLowerCase().includes(term))
    );
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterFacilityId = null;
    this.filterEditRequested = false;
    this.cdr.detectChanges();
  }

  // Form View Variables (Master)
  selectedFacilityId = signal<number | undefined>(undefined);
  selectedDepartmentId: number | '' = '';
  requestedBy: string = '';
  requestDate: string = '';
  editingRequestId: number | null = null;

  selectedPdfName: string | null = null;
  selectedPdfBase64: string | null = null;

  onPdfSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يجب اختيار ملف بصيغة PDF فقط' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الملف يجب ألا يتجاوز 5 ميجابايت' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const arr = new Uint8Array(e.target.result);
      if (arr.length < 4 || arr[0] !== 0x25 || arr[1] !== 0x50 || arr[2] !== 0x44 || arr[3] !== 0x46) {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'الملف المرفق ليس ملف PDF حقيقي وصالح' });
        return;
      }

      const base64Reader = new FileReader();
      base64Reader.onload = (el: any) => {
        this.selectedPdfBase64 = el.target.result;
        this.selectedPdfName = file.name;
        this.cdr.detectChanges();
      };
      base64Reader.readAsDataURL(file);
    };
    reader.readAsArrayBuffer(file);
  }

  clearSelectedPdf() {
    this.selectedPdfName = null;
    this.selectedPdfBase64 = null;
    this.cdr.detectChanges();
  }

  downloadPdf(req: any) {
    if (!req.pdfPath) return;
    const url = `${AppEnvironment.BASE_URL}/needs/${req.id}/pdf?type=equipment`;
    window.open(url, '_blank');
  }

  isNewDepartment: boolean = false;
  isAdminReviewOpen: boolean = false;
  adminReviewMessage: string = '';

  // Form View Variables (Detail Items Table)
  departments: Department[] = [];
  requestItems = signal<any[]>([]); // items currently added to list in memory
  editingItemIndex: number | null = null;

  // Single Item Form fields
  currentItem = this.createEmptyItem();

  facilities: Facility[] = [];

  // Dropdown options
  staffOptions = [
    { name: 'متوفر ومؤهل بالكامل في القسم', value: 'متوفر ومؤهل بالكامل' },
    { name: 'متوفر ويحتاج تدريب إضافي', value: 'متوفر ويحتاج لتدريب إضافي' },
    { name: 'غير متوفر ويحتاج لتعيين كادر جديد', value: 'غير متوفر ويحتاج لتعيين كادر جديد' }
  ];

  infrastructureOptions = [
    { name: 'المساحة والبنية التحتية جاهزة بالكامل', value: 'جاهزة بالكامل' },
    { name: 'تحتاج لتعديلات أو توصيلات طفيفة بالقسم', value: 'تحتاج تعديلات طفيفة' },
    { name: 'غير جاهزة وتحتاج تهيئة شاملة', value: 'غير جاهزة وتحتاج تهيئة شاملة' }
  ];

  constructor(
    public readonly healthcareService: HealthcareService,
    public readonly authService: AuthService,
    private readonly toast: MessageService,
    public readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly excelService: ExcelService
  ) {}

  exportExcel() {
    const data = this.filteredRequests;
    const headersMap = {
      id: 'رقم الطلب',
      'facility.facilityName': 'المرفق الصحي',
      'department.departmentName': 'القسم الطبي',
      requestDate: 'تاريخ التقديم',
      requestedBy: 'مقدم الطلب'
    };
    this.excelService.exportToExcel(data, 'طلبات_احتياج_الأجهزة', headersMap, 'طلبات الاحتياج');
  }

  exportRequestItemsExcel() {
    if (!this.selectedRequest || !this.selectedRequest.items) return;
    const data = this.selectedRequest.items;
    const headersMap = {
      scientificName: 'الاسم العلمي للجهاز',
      requiredQuantity: 'الكمية المطلوبة',
      currentQuantity: 'الكمية المتوفرة حاليا',
      qualifiedStaff: 'توفر الكادر المؤهل',
      infrastructureSpace: 'جاهزية الموقع والبنية التحتية',
      justifications: 'مبررات ودواعي الطلب'
    };
    this.excelService.exportToExcel(
      data, 
      `تفاصيل_طلب_احتياج_أجهزة_${this.selectedRequest.facility?.facilityName || 'المرفق'}_${this.selectedRequest.id}`, 
      headersMap, 
      'تفاصيل الاحتياج'
    );
  }

  ngOnInit() {
    this.loadAllRequests();
    this.loadFacilities();
    this.loadStoredDevices();

    const redirectId = this.healthcareService.selectedNeedRequestId();
    if (redirectId) {
      this.healthcareService.selectedNeedRequestId.set('');
      this.viewDetail(Number(redirectId));
    }
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
      }
    });
  }

  loadAllRequests() {
    this.loading.set(true);
    this.healthcareService.getEquipmentNeeds(undefined).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const user = this.authService.user();
          const roleName = (user?.role?.name || '').toLowerCase();
          const isAdmin = user?.roleId === '1' || roleName === 'admin' || roleName === 'مدير النظام' || roleName === 'مدير' || roleName.includes('admin') || user?.email === 'admin@admin.com';
          
          if (isAdmin) {
            this.requests = res.data;
          } else {
            const allowedIds = (user?.facilityIds || []).map((id: any) => Number(id));
            this.requests = res.data.filter((r: any) => allowedIds.includes(r.facilityId));
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  createEmptyItem() {
    return {
      scientificName: '',
      requiredQuantity: 1,
      currentQuantity: 0,
      qualifiedStaff: 'متوفر ومؤهل بالكامل',
      infrastructureSpace: 'جاهزة بالكامل',
      justifications: ''
    };
  }

  switchToCreate() {
    this.viewMode.set('create');
    this.selectedFacilityId.set(undefined);
    this.selectedDepartmentId = '';
    this.requestedBy = '';
    this.requestDate = new Date().toISOString().split('T')[0];
    this.requestItems.set([]);
    this.currentItem = this.createEmptyItem();
    this.departments = [];
    this.editingItemIndex = null;
    this.editingRequestId = null;
    this.isNewDepartment = false;
    this.clearSelectedPdf();
    this.cdr.detectChanges();
  }

  switchToList() {
    this.viewMode.set('list');
    this.isNewDepartment = false;
    this.clearSelectedPdf();
    this.loadAllRequests();
  }

  lifecycleLogs: any[] = [];
  reviewNotesHistory: any[] = [];
  isReviewDialogOpen = false;
  reviewStatus: 'APPROVED' | 'REJECTED' = 'APPROVED';
  reviewNotes = '';
  editReasonInput = '';
  isEditRequestDialogOpen = false;
  declineReasonInput = '';
  isDeclineRequestDialogOpen = false;
  editHistory: any[] = [];
  originalItems: any[] = [];
  facilityInventoryItems: any[] = [];

  openReviewDialog(status: 'APPROVED' | 'REJECTED') {
    this.reviewStatus = status;
    this.reviewNotes = '';
    this.isReviewDialogOpen = true;
    this.cdr.detectChanges();
  }

  confirmReview() {
    if (this.reviewStatus === 'REJECTED' && !this.reviewNotes.trim()) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى كتابة ملاحظات المراجعة لتوضيح سبب الرفض' });
      return;
    }

    const reqId = this.selectedRequest?.id;
    if (!reqId) return;

    this.healthcareService.reviewNeedRequest(reqId, 'equipment', this.reviewStatus, this.reviewNotes).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'تمت المراجعة', detail: `تم ${this.reviewStatus === 'APPROVED' ? 'استلام' : 'رفض'} الطلب بنجاح` });
          this.isReviewDialogOpen = false;
          this.viewDetail(reqId);
        }
      },
      error: (err: any) => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل في حفظ المراجعة' });
      }
    });
  }

  viewDetail(requestId: number) {
    this.loading.set(true);
    this.lifecycleLogs = [];
    this.reviewNotesHistory = [];
    this.editHistory = [];

    this.healthcareService.getLifecycleLogs('NEED_REQUEST_EQUIPMENT', requestId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.lifecycleLogs = res.data.logs;
          this.reviewNotesHistory = res.data.notes;
          this.cdr.detectChanges();
        }
      }
    });

    this.loadEditHistory(requestId);

    this.healthcareService.getEquipmentNeedById(requestId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.selectedRequest = res.data;
          this.viewMode.set('detail');
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
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
      'CREATE': 'تقديم طلب الاحتياج',
      'UPDATE': 'تعديل وتحديث الطلب',
      'DELETE': 'حذف طلب الاحتياج',
      'STATUS_CHANGE': 'تعديل حالة الاستلام والقبول',
      'SEND_NOTE': 'إرسال ملاحظة فنية',
    };
    return map[act] || act;
  }

  editRequest(requestId: number) {
    this.loading.set(true);
    this.healthcareService.getEquipmentNeedById(requestId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.editingRequestId = requestId;
          const r = res.data;
          this.selectedRequest = r;
          this.selectedFacilityId.set(r.facilityId);
          this.selectedDepartmentId = r.departmentId;
          this.requestedBy = r.requestedBy;
          this.requestDate = r.requestDate;

          const itemsMapped = (r.items || []).map((x: any) => ({
            scientificName: x.scientificName,
            requiredQuantity: x.requiredQuantity,
            currentQuantity: x.currentQuantity,
            qualifiedStaff: x.qualifiedStaff,
            infrastructureSpace: x.infrastructureSpace,
            justifications: x.justifications
          }));
          this.requestItems.set(itemsMapped);
          this.originalItems = JSON.parse(JSON.stringify(itemsMapped));
          this.loadFacilityInventory(r.facilityId);
          this.selectedPdfName = r.pdfName || null;
          this.selectedPdfBase64 = null;

          // Load departments
          this.healthcareService.getDepartments(r.facilityId).subscribe({
            next: (depRes: any) => {
              if (depRes.success && depRes.data) {
                this.departments = depRes.data;
                this.viewMode.set('edit');
                this.cdr.detectChanges();
              }
            }
          });
        }
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onFacilityChange(facilityId: number | undefined) {
    this.selectedFacilityId.set(facilityId);
    this.selectedDepartmentId = '';
    this.departments = [];
    this.facilityInventoryItems = [];
    
    if (facilityId) {
      this.loadFacilityInventory(facilityId);
      this.healthcareService.getDepartments(facilityId).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.departments = res.data;
            this.cdr.detectChanges();
          }
        }
      });
    }
  }

  addItem() {
    if (!this.currentItem.scientificName || !this.currentItem.requiredQuantity || !this.currentItem.justifications) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى إكمال الحقول الأساسية لطلب الاحتياج' });
      return;
    }

    const itemToAdd = { ...this.currentItem };

    // Enforce quantity reduction rule for normal users
    const user = this.authService.user();
    const isSystemAdmin = user?.roleId === '1';
    if (this.viewMode() === 'edit' && !isSystemAdmin) {
      const originalItem = this.originalItems.find(
        x => x.scientificName.trim().toLowerCase() === itemToAdd.scientificName.trim().toLowerCase()
      );
      if (originalItem) {
        if (Number(itemToAdd.currentQuantity || 0) < originalItem.currentQuantity) {
          this.toast.add({
            severity: 'error',
            summary: 'خطأ في التحقق',
            detail: `غير مسموح بتقليل الأجهزة المتوفرة الحالية لجهاز (${itemToAdd.scientificName}) عن القيمة الأصلية (${originalItem.currentQuantity}).`
          });
          return;
        }
      } else {
        if (Number(itemToAdd.currentQuantity || 0) < 0) {
          this.toast.add({
            severity: 'error',
            summary: 'خطأ في التحقق',
            detail: `غير مسموح بإضافة أجهزة متوفرة حالية جديدة.`
          });
          return;
        }
      }
    }



    const currentList = [...this.requestItems()];

    if (this.editingItemIndex !== null) {
      currentList[this.editingItemIndex] = itemToAdd;
      this.editingItemIndex = null;
      this.toast.add({ severity: 'success', summary: 'تم التحديث', detail: 'تم تحديث بند الاحتياج في القائمة' });
    } else {
      currentList.push(itemToAdd);
      this.toast.add({ severity: 'success', summary: 'تمت الإضافة', detail: 'تم إضافة بند الاحتياج للقائمة المؤقتة' });
    }

    this.requestItems.set(currentList);
    this.currentItem = this.createEmptyItem();
    this.cdr.detectChanges();
  }

  editItem(index: number) {
    this.editingItemIndex = index;
    const item = this.requestItems()[index];
    this.currentItem = { ...item };
    this.cdr.detectChanges();
  }

  deleteItemFromList(index: number) {
    const currentList = [...this.requestItems()];
    currentList.splice(index, 1);
    this.requestItems.set(currentList);
    if (this.editingItemIndex === index) {
      this.editingItemIndex = null;
      this.currentItem = this.createEmptyItem();
    }
    this.cdr.detectChanges();
  }

  saveRequest() {
    const facId = this.selectedFacilityId();
    if (!facId) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى اختيار المرفق أولا' });
      return;
    }

    const deptId = this.selectedDepartmentId;
    if (!deptId) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى تحديد القسم الطبي' });
      return;
    }

    const items = this.requestItems();
    if (items.length === 0) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'لا توجد بنود احتياج مضافة للطلب بعد' });
      return;
    }

    const hasPdf = this.selectedPdfBase64 || (this.viewMode() === 'edit' && this.selectedRequest?.pdfPath);
    if (!hasPdf) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى إرفاق ملف طلب الاحتياج الموقع بصيغة PDF أولا' });
      return;
    }

    // Mismatch check (skip if new department)
    const mismatch = [];
    if (!this.isNewDepartment) {
      for (const item of items) {
        const invCount = this.facilityInventoryItems
          .filter((x: any) => x.itemType === 'equipment' && x.scientificName.trim().toLowerCase() === item.scientificName.trim().toLowerCase())
          .reduce((sum: number, x: any) => sum + (x.quantity !== null && x.quantity !== undefined ? Number(x.quantity) : 1), 0);

        if (Number(item.currentQuantity || 0) > invCount) {
          mismatch.push({
            name: item.scientificName,
            entered: item.currentQuantity,
            available: invCount
          });
        }
      }
    }

    if (mismatch.length > 0) {
      this.mismatchItems = mismatch;
      this.isInventoryMismatchOpen = true;
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      requestedBy: this.requestedBy || 'موظف مسؤول',
      requestDate: this.requestDate || new Date().toISOString().split('T')[0],
      pdfBase64: this.selectedPdfBase64,
      pdfName: this.selectedPdfName,
      isNewDepartment: this.isNewDepartment,
      items: items.map(item => ({
        scientificName: item.scientificName,
        requiredQuantity: Number(item.requiredQuantity),
        currentQuantity: Number(item.currentQuantity || 0),
        qualifiedStaff: item.qualifiedStaff,
        infrastructureSpace: item.infrastructureSpace,
        justifications: item.justifications
      }))
    };

    if (this.viewMode() === 'edit') {
      const user = this.authService.user();
      const isSystemAdmin = user?.roleId === '1' || user?.email === 'admin@admin.com';
      if (!isSystemAdmin) {
        for (const item of items) {
          const originalItem = this.originalItems.find(
            x => x.scientificName.trim().toLowerCase() === item.scientificName.trim().toLowerCase()
          );
          if (originalItem) {
            if (Number(item.currentQuantity || 0) < originalItem.currentQuantity) {
              this.toast.add({
                severity: 'error',
                summary: 'خطأ في التحقق',
                detail: `لا يمكنك زيادة الكمية المتوفرة الحالية للجهاز (${item.scientificName}) عن القيمة الأصلية (${originalItem.currentQuantity}).`
              });
              return;
            }
          } else {
            if (Number(item.currentQuantity || 0) > 0) {
              this.toast.add({
                severity: 'error',
                summary: 'خطأ في التحقق',
                detail: `لا يمكنك إضافة أجهزة متوفرة حالية جديدة.`
              });
              return;
            }
          }
        }
      }

      this.healthcareService.updateEquipmentNeed(this.editingRequestId!, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث طلب الاحتياج بنجاح' });
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: err?.error?.message || 'فشل في تحديث طلب الاحتياج' });
        }
      });
    } else {
      this.healthcareService.addEquipmentNeed(facId, Number(deptId), payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            if (res.isNewDepartment) {
              this.adminReviewMessage = res.message || 'نظرا لأن هذا القسم جديد، فقد تم إرسال طلب الاحتياج مباشرة إلى الإدارة للمراجعة والتدقيق.' ;
              this.isAdminReviewOpen = true;
              this.cdr.detectChanges();
              return;
            }
            if (res.isInventoryApproved === false) {
              this.inventoryWarningMessage = res.message || 'يجب إجراء عملية حصر الأجهزة لهذه المرفق أولا واستلامها لتفعيل هذا الطلب.';
              this.isInventoryWarningOpen = true;
              this.cdr.detectChanges();
              return;
            }
            this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ وتقديم طلب الاحتياج الطبية بنجاح' });
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: err?.error?.message || 'فشل في حفظ طلب الاحتياج' });
        }
      });
    }
  }

  isInventoryWarningOpen = false;
  inventoryWarningMessage = '';

  onWarningConfirm() {
    this.isInventoryWarningOpen = false;
    this.router.navigate(['/inventory']);
  }

  isDeleteConfirmOpen = false;
  requestIdToDelete: number | null = null;

  deleteRequest(id: number) {
    this.requestIdToDelete = id;
    this.isDeleteConfirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeleteRequest() {
    if (!this.requestIdToDelete) return;
    this.healthcareService.deleteEquipmentNeed(this.requestIdToDelete).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف طلب الاحتياج بنجاح' });
          this.isDeleteConfirmOpen = false;
          this.requestIdToDelete = null;
          this.loadAllRequests();
        }
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف طلب الاحتياج' });
      }
    });
  }

  get filteredRequests() {
    let list = this.requests;
    const search = this.filterSearch.trim().toLowerCase();
    const facId = this.filterFacilityId;

    if (search) {
      list = list.filter(item => 
        (item.requestedBy && item.requestedBy.toLowerCase().includes(search)) ||
        (item.department?.departmentName && item.department.departmentName.toLowerCase().includes(search)) ||
        item.id.toString().includes(search)
      );
    }
    if (facId) {
      list = list.filter(item => item.facilityId === Number(facId));
    }
    if (this.filterEditRequested) {
      list = list.filter(item => item.editRequested);
    }
    return list;
  }

  getDeptName(deptId: number) {
    const d = this.departments.find(x => x.id === deptId);
    return d ? d.departmentName : 'غير معروف';
  }

  loadFacilityInventory(facilityId: number) {
    this.healthcareService.getInventory(facilityId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const allItems: any[] = [];
          for (const inv of res.data) {
            if (inv.items) {
              allItems.push(...inv.items);
            }
          }
          this.facilityInventoryItems = allItems;
          this.cdr.detectChanges();
        }
      }
    });
  }

  openEditRequestDialog() {
    this.editReasonInput = '';
    this.isEditRequestDialogOpen = true;
    this.cdr.detectChanges();
  }

  submitEditRequest() {
    if (!this.selectedRequest || !this.editReasonInput.trim()) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى كتابة سبب طلب التعديل' });
      return;
    }
    
    this.healthcareService.requestNeedEdit(this.selectedRequest.id, 'equipment', this.editReasonInput).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إرسال طلب التعديل بنجاح للمسؤول' });
          this.isEditRequestDialogOpen = false;
          this.viewDetail(this.selectedRequest!.id);
        }
      },
      error: (err: any) => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل إرسال طلب التعديل' });
      }
    });
  }

  respondEditRequest(action: 'approve' | 'decline') {
    if (!this.selectedRequest) return;
    
    if (action === 'decline' && !this.declineReasonInput.trim()) {
      this.isDeclineRequestDialogOpen = true;
      this.declineReasonInput = '';
      this.cdr.detectChanges();
      return;
    }

    const reason = action === 'decline' ? this.declineReasonInput : undefined;
    
    this.healthcareService.respondNeedEdit(this.selectedRequest.id, 'equipment', action, reason).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: `تم ${action === 'approve' ? 'الموافقة على' : 'رفض'} طلب التعديل بنجاح` });
          this.isDeclineRequestDialogOpen = false;
          this.viewDetail(this.selectedRequest!.id);
        }
      },
      error: (err: any) => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل اتخاذ القرار' });
      }
    });
  }

  loadEditHistory(requestId: number) {
    this.healthcareService.getNeedEditHistory(requestId, 'equipment').subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.editHistory = res.data;
          this.cdr.detectChanges();
        }
      }
    });
  }

  navigateToInventorySurvey() {
    this.isInventoryMismatchOpen = false;
    const facId = this.selectedFacilityId();
    const deptId = this.selectedDepartmentId;
    if (facId && deptId) {
      this.healthcareService.setSelectedFacilityId(facId);
      this.healthcareService.setSelectedDepartmentId(Number(deptId));
    }
    this.router.navigate(['/inventory']);
  }

  loadStoredDevices() {
    this.healthcareService.getStoredDevices().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.storedDevices = res.data;
          this.cdr.detectChanges();
        }
      }
    });
  }

  openAddStoredDeviceDialog() {
    this.isAddStoredDeviceDialogOpen = true;
    this.newStoredDeviceArabic = '';
    this.newStoredDeviceEnglish = '';
    this.cdr.detectChanges();
  }

  saveNewStoredDevice() {
    const arabic = this.newStoredDeviceArabic.trim();
    const english = this.newStoredDeviceEnglish.trim();
    if (!arabic || !english) return;

    this.healthcareService.createStoredDevice({ arabicName: arabic, englishName: english }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة الجهاز الجديد للنظام' });
          this.isAddStoredDeviceDialogOpen = false;
          this.healthcareService.getStoredDevices().subscribe({
            next: (res2: any) => {
              if (res2.success && res2.data) {
                this.storedDevices = res2.data;
                this.currentItem.scientificName = arabic;
                this.cdr.detectChanges();
              }
            }
          });
        }
      },
      error: (err: any) => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل إضافة الجهاز' });
      }
    });
  }

  onAdminReviewConfirm() {
    this.isAdminReviewOpen = false;
    this.isNewDepartment = false;
    this.switchToList();
  }
}

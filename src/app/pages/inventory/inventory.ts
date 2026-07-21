import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SectionHeader } from '../../components/section-header/section-header';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ButtonModule, Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tag } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { RadioButton } from 'primeng/radiobutton';
import { ExcelService } from '../../services/excel.service';
import {
  HealthcareService,
  Inventory,
  InventoryItem,
  Facility,
  Department,
} from '../../services/healthcare.service';
import { AuthService } from '../../services/auth-service';
import { SelectWithLabel } from '../../components/select-with-label/select-with-label';
import { TextBoxWithLabel } from '../../components/text-box-with-label/text-box-with-label';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-simple-inventory',
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
    RadioButton,
    SelectWithLabel,
    TextBoxWithLabel,
    Dialog,
  ],
  providers: [MessageService],
  templateUrl: './simple-inventory.html',
})
export class InventoryComponent implements OnInit {
  viewMode = signal<'list' | 'create' | 'edit' | 'detail'>('list');

  surveys: Inventory[] = [];
  selectedSurvey: Inventory | null = null;
  loading = signal<boolean>(false);

  filterSearch = '';
  filterFacilityId: any = null;
  filterSurveyType: any = null;
  todayDate = new Date().toISOString().split('T')[0];

  surveyFacilityId = signal<number | undefined>(undefined);
  surveyDepartmentId = signal<number | undefined>(undefined);
  surveyDate: string = '';
  surveyType: string = 'حصر سنوي عام';
  notes: string = '';
  editingSurveyKeys: { facilityId: number; departmentId: number } | null = null;

  departments: Department[] = [];
  surveyItems = signal<any[]>([]);
  editingItemIndex: number | null = null;

  currentItem = this.createEmptyItem();

  facilities: Facility[] = [];

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

  // surveyTypeOptions = [
  //   { name: 'حصر عام', value: 'حصر عام' },
  // ];

  operationalStatusList = [
    { name: 'Fully Functional (يعمل بكفاءة)', value: 'Fully Functional' },
    {
      name: 'Functional & Needs Supplies (يعمل ويحتاج مستلزمات)',
      value: 'Functional & Needs Supplies',
    },
    {
      name: 'Out of Service & Needs Maintenance (خارج الخدمة ويحتاج صيانة)',
      value: 'Out of Service & Needs Maintenance',
    },
    { name: 'Functional but Inactive (يعمل ولكنه غير مفعل)', value: 'Functional but Inactive' },
    { name: 'Scrapped (تالف )', value: 'Scrapped' },
  ];

  operationalStatusMap = new Map<
    string,
    { label: string; severity: 'success' | 'warn' | 'danger' | 'info' | 'secondary' }
  >([
    ['Fully Functional', { label: 'يعمل بكفاءة', severity: 'success' }],
    ['Functional & Needs Supplies', { label: 'يعمل ويحتاج مستلزمات', severity: 'info' }],
    [
      'Out of Service & Needs Maintenance',
      { label: 'خارج الخدمة ويحتاج صيانة', severity: 'danger' },
    ],
    ['Functional but Inactive', { label: 'يعمل ولكنه غير نشط', severity: 'warn' }],
    ['Scrapped', { label: 'تالف ', severity: 'secondary' }],
  ]);

  constructor(
    public readonly healthcareService: HealthcareService,
    public readonly authService: AuthService,
    private readonly toast: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly excelService: ExcelService,
    private readonly router: Router,
  ) {}

  exportExcel() {
    const data = this.filteredSurveys;
    const headersMap = {
      'facility.facilityName': 'المرفق الصحي',
      'department.departmentName': 'القسم الطبي',
      surveyDate: 'تاريخ الحصر',
      surveyType: 'نوع الحصر',
      notes: 'الملاحظات العامة',
      createdBy: 'كاتب السجل',
    };
    this.excelService.exportToExcel(data, 'سجلات_الحصر_والحصر', headersMap, 'سجلات الحصر');
  }

  exportSurveyItemsExcel() {
    if (!this.selectedSurvey || !this.selectedSurvey.items) return;
    const data = this.selectedSurvey.items;

    const mappedData = data.map((item) => ({
      ...item,
      itemTypeLabel: item.itemType === 'supply' ? 'مستلزمات ومشغلات طبية' : 'معدات وأجهزة طبية',
      operationalStatusLabel:
        this.operationalStatusMap.get(item.operationalStatus)?.label ||
        item.operationalStatus ||
        '-',
    }));

    const headersMap = {
      number: 'رقم العنصر',
      itemTypeLabel: 'النوع',
      scientificName: 'الاسم العلمي',
      model: 'الموديل',
      serialNumber: 'الرقم التسلسلي',
      manufacturer: 'الشركة المصنعة',
      countryOfOrigin: 'بلد المنشأ',
      manufacturingDate: 'تاريخ الصنع',
      installationDate: 'تاريخ التركيب',
      operationalStatusLabel: 'الحالة التشغيلية',
    };
    this.excelService.exportToExcel(
      mappedData,
      `عناصر_حصر_${this.selectedSurvey.facility?.facilityName || 'المرفق'}_${this.selectedSurvey.department?.departmentName || ''}`,
      headersMap,
      'عناصر الحصر',
    );
  }

  ngOnInit() {
    this.loadAllInventory();
    this.loadFacilities();
    this.loadStoredDevices();

    const redirectFacId = this.healthcareService.selectedFacilityId();
    const redirectDeptId = this.healthcareService.selectedDepartmentId();

    if (redirectFacId && redirectDeptId) {
      this.healthcareService.setSelectedFacilityId('');
      this.healthcareService.setSelectedDepartmentId('');

      this.healthcareService.getInventory(Number(redirectFacId)).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            const existingSurvey = res.data.find(
              (s: any) => s.facilityId === Number(redirectFacId) && s.departmentId === Number(redirectDeptId)
            );

            if (existingSurvey) {
              this.editSurvey(Number(redirectFacId), Number(redirectDeptId));
            } else {
              this.switchToCreate();
              this.onFacilityChange(Number(redirectFacId));
              this.surveyDepartmentId.set(Number(redirectDeptId));
              this.cdr.detectChanges();
            }
          }
        }
      });
    }
  }

  loadFacilities() {
    this.healthcareService.getFacilities().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          const user = this.authService.user();
          const roleName = (user?.role?.name || '').toLowerCase();
          const isAdmin =
            user?.roleId === '1' ||
            roleName === 'admin' ||
            roleName === 'مدير النظام' ||
            roleName === 'مدير' ||
            roleName.includes('admin') ||
            user?.email === 'admin@admin.com';

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

  loadAllInventory() {
    this.loading.set(true);
    this.healthcareService.getInventory(undefined).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          const user = this.authService.user();
          const roleName = (user?.role?.name || '').toLowerCase();
          const isAdmin =
            user?.roleId === '1' ||
            roleName === 'admin' ||
            roleName === 'مدير النظام' ||
            roleName === 'مدير' ||
            roleName.includes('admin') ||
            user?.email === 'admin@admin.com';

          if (isAdmin) {
            this.surveys = res.data;
          } else {
            const allowedIds = (user?.facilityIds || []).map((id: any) => Number(id));
            this.surveys = res.data.filter((s: any) => allowedIds.includes(s.facilityId));
          }
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  createEmptyItem() {
    return {
      itemType: 'equipment' as 'equipment' | 'supply',
      departmentId: '' as number | '',
      departmentName: '',
      scientificName: '',
      model: '',
      serialNumber: '',
      manufacturer: '',
      countryOfOrigin: '',
      manufacturingDate: '',
      supplierCompany: '',
      installationDate: '',
      operationalStatus: null as string | null,
      unit: '',
      quantity: null as number | null,
      minimumStock: null as number | null,
      itemImage: null as string | null,
      itemImageBase64: null as string | null,
      itemImageName: null as string | null,
    };
  }

  switchToCreate() {
    this.viewMode.set('create');
    this.surveyFacilityId.set(undefined);
    this.surveyDepartmentId.set(undefined);
    this.surveyDate = new Date().toISOString().split('T')[0];
    this.surveyType = 'حصر سنوي عام';
    this.notes = '';
    this.surveyItems.set([]);
    this.currentItem = this.createEmptyItem();
    this.departments = [];
    this.editingItemIndex = null;
    this.editingSurveyKeys = null;
    this.cdr.detectChanges();
  }

  switchToList() {
    this.viewMode.set('list');
    this.loadAllInventory();
  }

  resetFilters() {
    this.filterSearch = '';
    this.filterFacilityId = null;
    this.filterSurveyType = null;
    this.cdr.detectChanges();
  }

  reviewNotesList = signal<any[]>([]);
  lifecycleLogs: any[] = [];
  reviewNotesHistory: any[] = [];

  viewDetail(facilityId: number, departmentId: number) {
    console.log('VIEW DETAIL RUNNING...');

    this.loading.set(true);
    this.healthcareService.getInventoryById(facilityId, departmentId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        console.info(res);

        if (res.success && res.data) {
          this.selectedSurvey = res.data;

          const facId = res.data.facilityId;
          this.healthcareService.getLifecycleLogs('INVENTORY', undefined, facId).subscribe({
            next: (logsRes: any) => {
              if (logsRes.success && logsRes.data) {
                this.lifecycleLogs = logsRes.data.logs || [];
                this.reviewNotesHistory = logsRes.data.notes || [];
                this.reviewNotesList.set(logsRes.data.notes || []);
                this.cdr.detectChanges();
              }
            },
          });

          this.viewMode.set('detail');
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  editSurvey(facilityId: number, departmentId: number) {
    this.loading.set(true);
    this.healthcareService.getInventoryById(facilityId, departmentId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.editingSurveyKeys = { facilityId, departmentId };
          const s = res.data;
          this.surveyFacilityId.set(s.facilityId);
          this.surveyDepartmentId.set(s.departmentId);
          this.surveyDate = s.surveyDate;
          this.surveyType = s.surveyType;
          this.notes = s.notes;

          const mappedItems = (s.items || []).map((x: any) => ({
            itemType: x.itemType || 'equipment',
            departmentId: x.departmentId,
            departmentName: x.department?.departmentName || 'غير معروف',
            scientificName: x.scientificName,
            model: x.model || '',
            serialNumber: x.serialNumber || '',
            manufacturer: x.manufacturer,
            countryOfOrigin: x.countryOfOrigin,
            manufacturingDate: x.manufacturingDate || '',
            supplierCompany: x.supplierCompany,
            installationDate: x.installationDate,
            operationalStatus: x.operationalStatus || null,
            unit: x.unit || '',
            quantity: x.quantity ?? null,
            minimumStock: x.minimumStock ?? null,
            itemImage: x.itemImage || null,
            itemImageBase64: null,
            itemImageName: null,
          }));
          this.surveyItems.set(mappedItems);

          if (s.facilityId) {
            this.healthcareService.getDepartments(s.facilityId).subscribe({
              next: (deptRes: any) => {
                if (deptRes.success && deptRes.data) {
                  this.departments = deptRes.data;
                  this.cdr.detectChanges();
                }
              },
            });
          }

          this.viewMode.set('edit');
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.loading.set(false);
        this.cdr.detectChanges();
      },
    });
  }

  onFacilityChange(facilityId: number | undefined) {
    this.surveyFacilityId.set(facilityId);
    this.surveyDepartmentId.set(undefined);
    this.departments = [];
    this.currentItem.departmentId = '';

    if (facilityId) {
      this.healthcareService.getDepartments(facilityId).subscribe({
        next: (res: any) => {
          if (res.success && res.data) {
            this.departments = res.data;
            this.cdr.detectChanges();
          }
        },
      });
    }
  }

  onItemTypeChange() {
    const currentType = this.currentItem.itemType;
    const currentDeptId = this.currentItem.departmentId;
    const currentDeptName = this.currentItem.departmentName;
    this.currentItem = this.createEmptyItem();
    this.currentItem.itemType = currentType;
    this.currentItem.departmentId = currentDeptId;
    this.currentItem.departmentName = currentDeptName;
    this.cdr.detectChanges();
  }

  isAddItemDisabled(): boolean {
    const base =
      !this.surveyFacilityId() ||
      !this.surveyDepartmentId() ||
      !this.currentItem.scientificName;
    if (this.currentItem.itemType === 'equipment') {
      return base || !this.currentItem.model;
    }
    return base || !this.currentItem.unit;
  }

  addItem() {
    if (this.isAddItemDisabled()) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى إكمال الحقول الأساسية' });
      return;
    }

    const currentList = [...this.surveyItems()];

    if (this.currentItem.itemType === 'equipment' && this.currentItem.serialNumber?.trim()) {
      const hasDuplicate = currentList.some(
        (x, idx) =>
          idx !== this.editingItemIndex &&
          x.itemType === 'equipment' &&
          x.serialNumber &&
          x.serialNumber.trim().toLowerCase() ===
            this.currentItem.serialNumber.trim().toLowerCase(),
      );
      if (hasDuplicate) {
        this.toast.add({
          severity: 'error',
          summary: 'تنبيه',
          detail: `الرقم التسلسلي (${this.currentItem.serialNumber}) مضاف مسبقا في الدفعة الحالية.`,
        });
        return;
      }
    }

    const itemToAdd = {
      ...this.currentItem,
      departmentId: this.surveyDepartmentId()!,
      departmentName: this.getDeptName(Number(this.surveyDepartmentId())),
    };

    if (this.editingItemIndex !== null) {
      currentList[this.editingItemIndex] = itemToAdd;
      this.editingItemIndex = null;
      this.toast.add({
        severity: 'success',
        summary: 'تم التحديث',
        detail: 'تم تحديث بيانات العنصر في القائمة المؤقتة',
      });
    } else {
      currentList.push(itemToAdd);
      this.toast.add({
        severity: 'success',
        summary: 'تمت الإضافة',
        detail: 'تم إضافة العنصر للقائمة المؤقتة',
      });
    }

    this.surveyItems.set(currentList);
    this.currentItem = this.createEmptyItem();
    this.cdr.detectChanges();
  }

  editItem(index: number) {
    this.editingItemIndex = index;
    this.currentItem = { ...this.surveyItems()[index] };
    this.cdr.detectChanges();
  }

  deleteItemFromList(index: number) {
    const currentList = [...this.surveyItems()];
    currentList.splice(index, 1);
    this.surveyItems.set(currentList);
    if (this.editingItemIndex === index) {
      this.editingItemIndex = null;
      this.currentItem = this.createEmptyItem();
    }
    this.cdr.detectChanges();
  }

  saveSurvey() {
    const facId = this.surveyFacilityId();
    const deptId = this.surveyDepartmentId();
    if (!facId || !deptId) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى اختيار المرفق والقسم أولا' });
      return;
    }

    const items = this.surveyItems();
    if (items.length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'لا توجد عناصر مضافة لعملية الحصر بعد',
      });
      return;
    }

    const equipmentItems = items
      .filter((i) => i.itemType === 'equipment')
      .map((item) => ({
        departmentId: Number(deptId),
        scientificName: item.scientificName,
        model: item.model,
        serialNumber: item.serialNumber,
        manufacturer: item.manufacturer || '-',
        countryOfOrigin: item.countryOfOrigin || '-',
        manufacturingDate: item.manufacturingDate || '',
        supplierCompany: item.supplierCompany || '-',
        installationDate: item.installationDate || '',
        operationalStatus: item.operationalStatus,
        itemImage: item.itemImage || null,
        itemImageBase64: item.itemImageBase64 || null,
        itemImageName: item.itemImageName || null,
      }));

    const supplyItems = items
      .filter((i) => i.itemType === 'supply')
      .map((item) => ({
        departmentId: Number(deptId),
        scientificName: item.scientificName,
        unit: item.unit || '-',
        quantity: item.quantity ?? 0,
        minimumStock: item.minimumStock ?? 0,
        manufacturer: item.manufacturer || '-',
        supplierCompany: item.supplierCompany || '-',
      }));

    const payload = {
      surveyDate: this.surveyDate || new Date().toISOString().split('T')[0],
      surveyType: this.surveyType,
      notes: this.notes || '',
      departmentId: Number(deptId),
      items: equipmentItems,
      supplyItems: supplyItems,
    };

    if (this.viewMode() === 'edit') {
      const keys = this.editingSurveyKeys!;
      this.healthcareService.updateInventory(keys.facilityId, keys.departmentId, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toast.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم تحديث عملية الحصر بنجاح',
            });
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: err?.error?.message || 'فشل في تحديث عملية الحصر',
          });
        },
      });
    } else {
      this.healthcareService.addInventory(facId, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toast.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم حفظ وحصر العناصر في المرفق بنجاح',
            });
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: err?.error?.message || 'فشل في حفظ عملية الحصر',
          });
        },
      });
    }
  }

  isDeleteConfirmOpen = false;
  surveyToDeleteKeys: { facilityId: number; departmentId: number } | null = null;

  deleteSurvey(facilityId: number, departmentId: number) {
    this.surveyToDeleteKeys = { facilityId, departmentId };
    this.isDeleteConfirmOpen = true;
    this.cdr.detectChanges();
  }

  confirmDeleteSurvey() {
    if (!this.surveyToDeleteKeys) return;
    const { facilityId, departmentId } = this.surveyToDeleteKeys;
    this.healthcareService.deleteInventory(facilityId, departmentId).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم حذف عملية الحصر بنجاح',
          });
          this.isDeleteConfirmOpen = false;
          this.surveyToDeleteKeys = null;
          this.loadAllInventory();
        }
      },
      error: () => {
        this.toast.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في حذف عملية الحصر من المنظومة',
        });
      },
    });
  }

  get filteredSurveys() {
    let list = this.surveys;
    const search = this.filterSearch.trim().toLowerCase();
    const facId = this.filterFacilityId;
    const type = this.filterSurveyType;

    if (search) {
      list = list.filter(
        (survey) =>
          (survey.notes && survey.notes.toLowerCase().includes(search)) ||
          (survey.createdBy && survey.createdBy.toLowerCase().includes(search)) ||
          (survey.facility?.facilityName && survey.facility.facilityName.toLowerCase().includes(search)) ||
          (survey.department?.departmentName && survey.department.departmentName.toLowerCase().includes(search)),
      );
    }
    if (facId) {
      list = list.filter((survey) => survey.facilityId === Number(facId));
    }
    if (type) {
      list = list.filter((survey) => survey.surveyType === type);
    }
    return list;
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

  getDeptName(deptId: number) {
    const d = this.departments.find((x) => x.id === deptId);
    return d ? d.departmentName : 'غير معروف';
  }

  isImagePreviewOpen = false;
  previewImageUrl = '';

  onItemImageSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى اختيار ملف صورة صالح' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.currentItem.itemImageBase64 = e.target.result;
      this.currentItem.itemImageName = file.name;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    this.cdr.detectChanges();
  }

  clearItemImage() {
    this.currentItem.itemImageBase64 = null;
    this.currentItem.itemImageName = null;
    this.currentItem.itemImage = null;
    this.cdr.detectChanges();
  }

  getItemImageUrl(itemImage: string | undefined | null): string {
    if (!itemImage) return '';
    const parts = itemImage.split('/');
    if (parts.length < 4) return '';
    const facilityId = parts[1];
    const departmentId = parts[2];
    const filename = parts[3];
    return `${this.healthcareService.baseUrl}/inventory/image/${facilityId}/${departmentId}/${filename}`;
  }

  showLargeImage(itemImage: string) {
    this.previewImageUrl = this.getItemImageUrl(itemImage);
    this.isImagePreviewOpen = true;
    this.cdr.detectChanges();
  }
}

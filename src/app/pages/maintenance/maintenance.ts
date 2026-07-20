import { Component, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ExcelService } from '../../services/excel.service';
import { HealthcareService, MaintenanceRequest, MaintenanceRequestItem, Facility, Department } from '../../services/healthcare.service';
import { AuthService } from '../../services/auth-service';
import { SelectWithLabel } from '../../components/select-with-label/select-with-label';
import { TextBoxWithLabel } from '../../components/text-box-with-label/text-box-with-label';
import { Dialog } from 'primeng/dialog';

@Component({
  selector: 'app-simple-maintenance',
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
  templateUrl: './maintenance.html',
})
export class MaintenanceComponent implements OnInit {
  viewMode = signal<'list' | 'create' | 'edit' | 'detail'>('list');

  // List View Variables
  requests: MaintenanceRequest[] = [];
  selectedRequest: MaintenanceRequest | null = null;
  loading = signal<boolean>(false);

  // Filters
  filterSearch = '';
  filterFacilityId: any = null;
  todayDate = new Date().toISOString().split('T')[0];

  resetFilters() {
    this.filterSearch = '';
    this.filterFacilityId = null;
    this.cdr.detectChanges();
  }

  // Form View Variables (Master)
  selectedFacilityId = signal<number | undefined>(undefined);
  selectedDepartmentId: number | '' = '';
  requestDate: string = '';
  editingRequestId: number | null = null;

  // Form View Variables (Detail Items Table)
  departments: Department[] = [];
  requestItems = signal<any[]>([]); // items currently added to list in memory
  editingItemIndex: number | null = null;

  // Single Item Form fields
  currentItem = this.createEmptyItem();

  facilities: Facility[] = [];

  // Dropdowns list options
  contractOptions = [
    { name: 'متوفر وساري المفعول', value: 'Available' },
    { name: 'غير متوفر', value: 'Not Available' }
  ];

  warrantyOptions = [
    { name: 'ساري المفعول', value: 'Available' },
    { name: 'منتهي أو غير متاح', value: 'Not Available' }
  ];

  conditionOptions = [
    { name: 'يعمل ويحتاج صيانة دورية', value: 'Functional & Needs Routine Maintenance' },
    { name: 'لا يعمل ويحتاج لإصلاح فني', value: 'Not Functional & Needs Maintenance' },
    { name: 'خارج الخدمة تماما', value: 'Out of Service' }
  ];

  conditionMap = new Map<string, { label: string; severity: 'success' | 'warn' | 'danger' }>([
    ['Functional & Needs Routine Maintenance', { label: 'يعمل ويحتاج صيانة دورية', severity: 'success' }],
    ['Not Functional & Needs Maintenance', { label: 'معطل ويحتاج لإصلاح فني', severity: 'warn' }],
    ['Out of Service', { label: 'خارج الخدمة تماما', severity: 'danger' }]
  ]);

  constructor(
    public readonly healthcareService: HealthcareService,
    public readonly authService: AuthService,
    private readonly toast: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly excelService: ExcelService
  ) {}

  exportExcel() {
    const data = this.filteredRequests;
    const headersMap = {
      id: 'رقم البلاغ',
      'facility.facilityName': 'المرفق الصحي',
      'department.departmentName': 'القسم الطبي',
      requestDate: 'تاريخ البلاغ'
    };
    this.excelService.exportToExcel(data, 'بلاغات_الصيانة_المقدمة', headersMap, 'طلبات الصيانة');
  }

  exportRequestItemsExcel() {
    if (!this.selectedRequest || !this.selectedRequest.items) return;
    const data = this.selectedRequest.items;
    
    const mappedData = data.map(item => ({
      ...item,
      conditionLabel: this.conditionMap.get(item.deviceCondition)?.label || item.deviceCondition || '-',
      contractLabel: item.maintenanceContract === 'Available' ? 'متوفر وساري' : 'غير متوفر',
      warrantyLabel: item.warranty === 'Available' ? 'ساري المفعول' : 'منتهي أو غير متاح',
      contractNumberLabel: item.maintenanceContract === 'Available' ? (item.contractNumber || '-') : '-',
      yearsLabel: item.maintenanceContract === 'Available' ? (item.years !== undefined && item.years !== null ? item.years : '-') : '-',
      monthsLabel: item.maintenanceContract === 'Available' ? (item.months !== undefined && item.months !== null ? item.months : '-') : '-',
      daysLabel: item.maintenanceContract === 'Available' ? (item.days !== undefined && item.days !== null ? item.days : '-') : '-',
      manufacturingDateLabel: item.manufacturingDate || '-'
    }));

    const headersMap = {
      scientificName: 'اسم الجهاز الطبي',
      model: 'الموديل',
      serialNumber: 'الرقم التسلسلي',
      manufacturer: 'الشركة المصنعة',
      countryOfOrigin: 'بلد المنشأ',
      manufacturingDateLabel: 'تاريخ الصنع',
      contractLabel: 'عقد صيانة',
      contractNumberLabel: 'رقم العقد',
      yearsLabel: 'مدة العقد (سنوات)',
      monthsLabel: 'مدة العقد (أشهر)',
      daysLabel: 'مدة العقد (أيام)',
      warrantyLabel: 'الضمان',
      conditionLabel: 'الحالة الحالية للجهاز',
      faultDescription: 'وصف العطل بالتفصيل',
      technicalEngineer: 'المهندس الفني المسؤول',
      phoneNumber: 'رقم الهاتف للتواصل',
      headOfDepartment: 'رئيس القسم المستلم'
    };
    this.excelService.exportToExcel(
      mappedData, 
      `تفاصيل_بلاغ_صيانة_${this.selectedRequest.facility?.facilityName || 'المرفق'}_${this.selectedRequest.id}`, 
      headersMap, 
      'أجهزة بلاغ الصيانة'
    );
  }

  ngOnInit() {
    this.loadAllRequests();
    this.loadFacilities();
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
    this.healthcareService.getMaintenanceRequests(undefined).subscribe({
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
      deviceName: '',
      model: '',
      serialNumber: '',
      installationDate: '',
      manufacturer: '',
      countryOfOrigin: '',
      manufacturingDate: '',
      maintenanceContract: 'Available',
      contractNumber: '',
      days: null as number | null,
      months: null as number | null,
      years: null as number | null,
      warranty: 'Available',
      deviceCondition: 'Functional & Needs Routine Maintenance',
      faultDescription: '',
      technicalEngineer: '',
      phoneNumber: '',
      headOfDepartment: ''
    };
  }

  switchToCreate() {
    this.viewMode.set('create');
    this.selectedFacilityId.set(undefined);
    this.selectedDepartmentId = '';
    this.requestDate = new Date().toISOString().split('T')[0];
    this.requestItems.set([]);
    this.currentItem = this.createEmptyItem();
    this.departments = [];
    this.editingItemIndex = null;
    this.editingRequestId = null;
    this.cdr.detectChanges();
  }

  switchToList() {
    this.viewMode.set('list');
    this.loadAllRequests();
  }

  viewDetail(requestId: number) {
    this.loading.set(true);
    this.healthcareService.getMaintenanceRequestById(requestId).subscribe({
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

  editRequest(requestId: number) {
    this.loading.set(true);
    this.healthcareService.getMaintenanceRequestById(requestId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.editingRequestId = requestId;
          const r = res.data;
          this.selectedFacilityId.set(r.facilityId);
          this.selectedDepartmentId = r.departmentId;
          this.requestDate = r.requestDate;

          const itemsMapped = (r.items || []).map((x: any) => ({
            deviceName: x.deviceName,
            model: x.model,
            serialNumber: x.serialNumber,
            installationDate: x.installationDate,
            manufacturer: x.manufacturer,
            countryOfOrigin: x.countryOfOrigin,
            manufacturingDate: x.manufacturingDate || '',
            maintenanceContract: x.maintenanceContract,
            contractNumber: x.contractNumber || '',
            days: x.days,
            months: x.months,
            years: x.years,
            warranty: x.warranty,
            deviceCondition: x.deviceCondition,
            faultDescription: x.faultDescription,
            technicalEngineer: x.technicalEngineer,
            phoneNumber: x.phoneNumber,
            headOfDepartment: x.headOfDepartment
          }));
          this.requestItems.set(itemsMapped);

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
    
    if (facilityId) {
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
    if (!this.currentItem.deviceName || !this.currentItem.model || !this.currentItem.serialNumber || !this.currentItem.faultDescription || !this.currentItem.technicalEngineer || !this.currentItem.phoneNumber || !this.currentItem.headOfDepartment) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى تعبئة كافة حقول البلاغ الإلزامية' });
      return;
    }

    const itemToAdd = { ...this.currentItem };
    const currentList = [...this.requestItems()];

    if (this.editingItemIndex !== null) {
      currentList[this.editingItemIndex] = itemToAdd;
      this.editingItemIndex = null;
      this.toast.add({ severity: 'success', summary: 'تم التحديث', detail: 'تم تحديث بلاغ الصيانة في القائمة' });
    } else {
      currentList.push(itemToAdd);
      this.toast.add({ severity: 'success', summary: 'تمت الإضافة', detail: 'تم إضافة بلاغ الصيانة للقائمة المؤقتة' });
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
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'لا توجد بلاغات أعطال مضافة للطلب بعد' });
      return;
    }

    const payload = {
      requestDate: this.requestDate || new Date().toISOString().split('T')[0],
      items: items.map(item => ({
        deviceName: item.deviceName,
        model: item.model,
        serialNumber: item.serialNumber,
        installationDate: item.installationDate || '',
        manufacturer: item.manufacturer || '-',
        countryOfOrigin: item.countryOfOrigin || '-',
        manufacturingDate: item.manufacturingDate || '',
        maintenanceContract: item.maintenanceContract,
        contractNumber: item.maintenanceContract === 'Available' ? item.contractNumber : '',
        days: item.maintenanceContract === 'Available' && item.days !== null && item.days !== '' ? Number(item.days) : null,
        months: item.maintenanceContract === 'Available' && item.months !== null && item.months !== '' ? Number(item.months) : null,
        years: item.maintenanceContract === 'Available' && item.years !== null && item.years !== '' ? Number(item.years) : null,
        warranty: item.warranty,
        deviceCondition: item.deviceCondition,
        faultDescription: item.faultDescription,
        technicalEngineer: item.technicalEngineer,
        phoneNumber: item.phoneNumber,
        headOfDepartment: item.headOfDepartment
      }))
    };

    if (this.viewMode() === 'edit') {
      this.healthcareService.updateMaintenanceRequest(this.editingRequestId!, payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث طلب بلاغات الصيانة بنجاح' });
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: err?.error?.message || 'فشل في تحديث بلاغات الصيانة' });
        }
      });
    } else {
      this.healthcareService.addMaintenanceRequest(facId, Number(deptId), payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ وإرسال بلاغات الصيانة بنجاح' });
            this.switchToList();
          }
        },
        error: (err: any) => {
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: err?.error?.message || 'فشل في إرسال بلاغ الصيانة' });
        }
      });
    }
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
    this.healthcareService.deleteMaintenanceRequest(this.requestIdToDelete).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حذف بلاغات الصيانة بنجاح' });
          this.isDeleteConfirmOpen = false;
          this.requestIdToDelete = null;
          this.loadAllRequests();
        }
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف بلاغات الصيانة' });
      }
    });
  }

  get filteredRequests() {
    let list = this.requests;
    const search = this.filterSearch.trim().toLowerCase();
    const facId = this.filterFacilityId;

    if (search) {
      list = list.filter(item => 
        (item.department?.departmentName && item.department.departmentName.toLowerCase().includes(search)) ||
        item.id.toString().includes(search)
      );
    }
    if (facId) {
      list = list.filter(item => item.facilityId === Number(facId));
    }
    return list;
  }

  getDeptName(deptId: number) {
    const d = this.departments.find(x => x.id === deptId);
    return d ? d.departmentName : 'غير معروف';
  }
}

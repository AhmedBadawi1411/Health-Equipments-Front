import { Component, OnInit, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { SelectWithLabel } from '../../components/select-with-label/select-with-label';
import { TextBoxWithLabel } from '../../components/text-box-with-label/text-box-with-label';
import { SectionHeader } from '../../components/section-header/section-header';
import { InventoryStatusPipe } from '../../pipes/inventory-status-pipe';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ExcelService } from '../../services/excel.service';
import {
  HealthcareService,
  Facility,
  Department,
} from '../../services/healthcare.service';
import { AuthService } from '../../services/auth-service';
import * as L from 'leaflet';

@Component({
  selector: 'app-simple-facilities',
  standalone: true,
  imports: [
    TagModule,
    TableModule,
    Dialog,
    SelectWithLabel,
    TextBoxWithLabel,
    SectionHeader,
    InventoryStatusPipe,
    Button,
    Menu,
    ToastModule,
    CommonModule,
    FormsModule,
    ConfirmDialogModule,
    RouterLink,
    Select,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './facilities.html',
  styleUrl: './facilities.css',
})
export class FacilitiesComponent implements OnInit {
  facilities: Facility[] = [];
  searchText = '';
  selectedType: any = null;
  selectedStatus: any = null;
  selectedRegion: any = null;
  selectedHealthZone: any = null;

  typeOptions = [
    { name: 'مستشفي جامعي', value: 'مستشفي جامعي' },
    { name: 'مركز طبي', value: 'مركز طبي' },
    {
      name: 'المستشفيات العامة والتخصصية والتعليمية والقروية',
      value: 'المستشفيات العامة والتخصصية والتعليمية والقروية',
    },
    { name: 'المراكز التخصصية', value: 'المراكز التخصصية' },
    { name: 'العيادات المجمعة', value: 'العيادات المجمعة' },
    { name: 'مكاتب الخدمات الصحية بالمنطقة', value: 'مكاتب الخدمات الصحية بالمنطقة' },
  ];

  statusOptions = [
    { name: 'لم تبدأ بعد', value: 'NOT_STARTED' },
    { name: 'بانتظار الاستلام', value: 'PENDING_APPROVAL' },
    { name: 'تمت الموافقة', value: 'APPROVED' },
    { name: 'مرفوض للتعديل', value: 'REJECTED' },
  ];

  get regionOptions() {
    const uniqueRegions = Array.from(new Set(this.facilities.map((f) => f.region).filter(Boolean)));
    return uniqueRegions.map((r) => ({ name: r, value: r }));
  }

  get healthZoneOptions() {
    const uniqueZones = Array.from(new Set(this.facilities.map((f) => f.healthZone).filter(Boolean)));
    return uniqueZones.map((z) => ({ name: z, value: z }));
  }

  // Facility Edit / Add Modal
  isFacilityModalOpen = false;
  isEditing = false;
  editingFacility: any = {};

  activeItem: any = null;
  menuItems: any[] = [];

  cols = [
    { field: 'id', header: 'ت' },
    { field: 'healthZone', header: 'المنطقة الصحية' },
    { field: 'region', header: 'البلدية' },
    { field: 'facilityName', header: 'الاسم' },
    { field: 'facilityLevel', header: 'المستوي' },
    { field: 'bedCapacity', header: 'السعة' },
    { field: 'director', header: 'المدير المسؤول' },
    { field: 'inventoryStatus', header: 'الحالة' },
  ];

  constructor(
    public readonly healthcareService: HealthcareService,
    public readonly authService: AuthService,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly cdr: ChangeDetectorRef,
    private readonly excelService: ExcelService,
    private readonly confirmationService: ConfirmationService,
  ) {}

  exportExcel() {
    const data = this.filteredFacilities();
    const headersMap = {
      id: 'ت',
      healthZone: 'المنطقة الصحية',
      region: 'البلدية',
      facilityName: 'الاسم',
      facilityLevel: 'النوع والمستوى',
      bedCapacity: 'السعة السريرية',
      director: 'المدير المسؤول',
      inventoryStatus: 'حالة الحصر',
    };

    const statusLabels: Record<string, string> = {
      NOT_STARTED: 'لم تبدأ بعد',
      PENDING_APPROVAL: 'بانتظار الاستلام',
      APPROVED: 'تمت الموافقة',
    };

    const mappedData = data.map((item) => ({
      ...item,
      inventoryStatus: statusLabels[item.inventoryStatus] || item.inventoryStatus,
    }));

    this.excelService.exportToExcel(mappedData, 'المرافق_الصحية', headersMap, 'المرافق');
  }

  ngOnInit() {
    this.loadFacilities();
    this.initMenuItems();
    this.loadStoredDepartments();
  }

  initMenuItems() {
    this.menuItems = [
      {
        label: 'عرض التفاصيل / تعديل',
        type:'normal',
        icon: 'pi pi-pencil',
        command: () => {
          if (this.activeItem) {
            this.openEditFacility(this.activeItem);
          }
        },
      },
      {
        label: 'الأقسام الطبية',
        type:'normal',
        icon: 'pi pi-folder',
        command: () => {
          if (this.activeItem) {
            this.openDeptModal(this.activeItem);
          }
        },
      },
      {
        label: 'حذف المرفق',
        type:'danger',
        icon: 'pi pi-trash',
        visible: this.authService.hasPermission('facility:delete'),
        command: () => {
          if (this.activeItem) {
            this.deleteFacility(this.activeItem.id);
          }
        },
      },
    ].filter((item) => item.visible !== false);
  }

  loadFacilities() {
    this.healthcareService.getFacilities().subscribe({
      next: (res) => {
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
            const allowedIds = (user?.facilities || []).map((f) => f.id);
            this.facilities = res.data.filter((f) => allowedIds.includes(f.id));
          }
          this.cdr.detectChanges();
        }
      },
    });
  }

  filteredFacilities() {
    let list = this.facilities;
    const search = this.searchText.trim().toLowerCase();
    const type = this.selectedType?.value;
    const status = this.selectedStatus?.value;
    const region = this.selectedRegion?.value;
    const healthZone = this.selectedHealthZone?.value;

    if (search) {
      list = list.filter(
        (f) =>
          f.facilityName.toLowerCase().includes(search) ||
          f.id.toString().includes(search) ||
          f.director.toLowerCase().includes(search),
      );
    }
    if (type) {
      list = list.filter((f) => f.facilityLevel === type);
    }
    if (status) {
      list = list.filter((f) => f.inventoryStatus === status);
    }
    if (region) {
      list = list.filter((f) => f.region === region);
    }
    if (healthZone) {
      list = list.filter((f) => f.healthZone === healthZone);
    }
    return list;
  }

  resetFilters() {
    this.searchText = '';
    this.selectedType = null;
    this.selectedStatus = null;
    this.selectedRegion = null;
    this.selectedHealthZone = null;
    this.cdr.detectChanges();
  }

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  initMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }

    const defaultLat = this.editingFacility.lat || 28.5;
    const defaultLng = this.editingFacility.lng || 17.5;
    const zoom = this.editingFacility.lat ? 12 : 5;

    this.map = L.map('locationPicker').setView([defaultLat, defaultLng], zoom);

    L.tileLayer(
      'https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}.jpg?key=Vn2msMKcNgIrOkz1Tspd',
      {
        maxZoom: 19,
      },
    ).addTo(this.map);

    if (this.editingFacility.lat && this.editingFacility.lng) {
      this.drawPoint(this.editingFacility.lat, this.editingFacility.lng);
    }

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.editingFacility.lat = event.latlng.lat;
      this.editingFacility.lng = event.latlng.lng;
      this.drawPoint(event.latlng.lat, event.latlng.lng);
      this.cdr.detectChanges();
    });
  }

  drawPoint(lat: number, lng: number) {
    if (this.marker) {
      this.map?.removeLayer(this.marker);
    }
    if (this.map) {
      this.marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: '/media/gps.png',
          iconSize: [60, 60],
          iconAnchor: [30, 60],
        }),
      }).addTo(this.map);
    }
  }

  onCoordinatesChanged() {
    const lat = Number(this.editingFacility.lat);
    const lng = Number(this.editingFacility.lng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      this.drawPoint(lat, lng);
      this.map?.setView([lat, lng], 12);
    }
  }

  onAdd() {
    this.isEditing = false;
    this.editingFacility = {
      facilityName: '',
      facilityLevel: 'مشفي',
      healthZone: '',
      region: '',
      bedCapacity: 0,
      director: '',
      lat: undefined,
      lng: undefined,
    };
    this.isFacilityModalOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  openEditFacility(fac: Facility) {
    this.isEditing = true;
    this.editingFacility = { ...fac };
    this.isFacilityModalOpen = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  closeFacilityModal() {
    this.isFacilityModalOpen = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
    this.cdr.detectChanges();
  }

  saveFacilityEdits() {
    const { id, facilityName, facilityLevel, healthZone, region, bedCapacity, director, lat, lng } =
      this.editingFacility;
    if (!facilityName || !facilityLevel || !healthZone || !region || bedCapacity === undefined || !director) {
      this.toast.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يرجى ملء جميع الحقول المطلوبة',
      });
      return;
    }

    const payload = {
      facilityName,
      facilityLevel,
      healthZone,
      region,
      bedCapacity: Number(bedCapacity),
      director,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    };

    if (this.isEditing) {
      this.healthcareService.updateFacility(id, payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تم تحديث بيانات المرفق بنجاح',
            });
            this.isFacilityModalOpen = false;
            this.loadFacilities();
          }
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في تحديث بيانات المرفق',
          }),
      });
    } else {
      this.healthcareService.createFacility(payload).subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.add({
              severity: 'success',
              summary: 'نجاح',
              detail: 'تمت إضافة المرفق الصحي بنجاح',
            });
            this.isFacilityModalOpen = false;
            this.loadFacilities();
          }
        },
        error: () =>
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في إضافة المرفق الصحي',
          }),
      });
    }
  }

  deleteFacility(facId: number) {
    this.confirmationService.confirm({
      message:
        'تحذير: هل أنت متأكد من حذف هذه المرفق الطبية نهائيا؟ سيتم حذف جميع الأجهزة، والطلبات، والأقسام المرتبطة بها!',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.healthcareService.deleteFacility(facId).subscribe({
          next: (res) => {
            if (res.success) {
              this.toast.add({
                severity: 'success',
                summary: 'نجاح',
                detail: 'تم حذف المرفق الطبية بنجاح',
              });
              if (this.healthcareService.selectedFacilityId() === facId) {
                this.healthcareService.setSelectedFacilityId('');
              }
              this.loadFacilities();
            }
          },
          error: () =>
            this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في حذف المرفق' }),
        });
      },
    });
  }

  // --- Combined Department Management ---
  isDeptModalOpen = false;
  departments: Department[] = [];
  newDeptName = '';
  editingDeptIndex: number | null = null;
  editingDeptName = '';

  storedDepartments: any[] = [];
  isAddStoredDeptDialogOpen = false;
  newStoredDeptArabic = '';
  newStoredDeptEnglish = '';

  get filteredStoredDepartments() {
    const term = (this.newDeptName || '').trim().toLowerCase();
    if (!term) return this.storedDepartments;
    return this.storedDepartments.filter(d => 
      (d.arabicName && d.arabicName.toLowerCase().includes(term)) ||
      (d.englishName && d.englishName.toLowerCase().includes(term))
    );
  }

  loadStoredDepartments() {
    this.healthcareService.getStoredDepartments().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.storedDepartments = res.data;
          this.cdr.detectChanges();
        }
      }
    });
  }

  openAddStoredDeptDialog() {
    this.isAddStoredDeptDialogOpen = true;
    this.newStoredDeptArabic = '';
    this.newStoredDeptEnglish = '';
    this.cdr.detectChanges();
  }

  saveNewStoredDept() {
    const arabic = this.newStoredDeptArabic.trim();
    const english = this.newStoredDeptEnglish.trim();
    if (!arabic || !english) return;

    this.healthcareService.createStoredDepartment({ arabicName: arabic, englishName: english }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة القسم الجديد للنظام' });
          this.isAddStoredDeptDialogOpen = false;
          this.healthcareService.getStoredDepartments().subscribe({
            next: (res2: any) => {
              if (res2.success && res2.data) {
                this.storedDepartments = res2.data;
                this.newDeptName = arabic;
                this.cdr.detectChanges();
              }
            }
          });
        }
      },
      error: (err: any) => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل إضافة القسم' });
      }
    });
  }

  openDeptModal(facility: any) {
    this.activeItem = facility;
    this.newDeptName = '';
    this.editingDeptIndex = null;
    this.loadDepartments(facility.id);
    this.cdr.detectChanges();
  }

  loadDepartments(facilityId: number) {
    this.healthcareService.getDepartments(facilityId).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.departments = res.data;
          this.isDeptModalOpen = true;
          this.cdr.detectChanges();
        }
      },
    });
  }

  addDept() {
    const deptName = this.newDeptName.trim();
    if (!deptName) return;

    // Check if the department name already exists in this facility (case-insensitive and trimmed)
    const exists = this.departments.some(
      (d) => d.departmentName.trim().toLowerCase() === deptName.toLowerCase(),
    );

    if (exists) {
      this.toast.add({
        severity: 'error',
        summary: 'تنبيه',
        detail: 'اسم القسم موجود بالفعل في هذه المرفق',
      });
      return;
    }

    this.healthcareService.createDepartment(this.activeItem.id, deptName).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم إضافة القسم بنجاح' });
          this.newDeptName = '';
          this.loadDepartments(this.activeItem.id);
        }
      },
    });
  }

  startEditDept(index: number, dept: Department) {
    this.editingDeptIndex = index;
    this.editingDeptName = dept.departmentName;
    this.cdr.detectChanges();
  }

  saveEditDept(dept: Department) {
    const deptName = this.editingDeptName.trim();
    if (!deptName) return;

    // Check if another department (excluding the one being edited) already has the same name
    const exists = this.departments.some(
      (d) => d.id !== dept.id && d.departmentName.trim().toLowerCase() === deptName.toLowerCase(),
    );

    if (exists) {
      this.toast.add({
        severity: 'error',
        summary: 'تنبيه',
        detail: 'اسم القسم موجود بالفعل في هذه المرفق',
      });
      return;
    }

    this.healthcareService.updateDepartment(dept.id, deptName).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.toast.add({
            severity: 'success',
            summary: 'نجاح',
            detail: 'تم تحديث اسم القسم بنجاح',
          });
          this.editingDeptIndex = null;
          this.loadDepartments(this.activeItem.id);
        }
      },
    });
  }

  deleteDept(deptId: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من رغبتك في حذف هذا القسم؟ سيتم حذف كافة الارتباطات التابعة له.',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.healthcareService.deleteDepartment(deptId).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.toast.add({
                severity: 'success',
                summary: 'نجاح',
                detail: 'تم حذف القسم بنجاح',
              });
              this.loadDepartments(this.activeItem.id);
            }
          },
        });
      },
    });
  }

  getSeverity(
    status: string,
  ): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (status) {
      case 'NOT_STARTED':
        return 'secondary';
      case 'PENDING_APPROVAL':
        return 'warn';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'danger';
      default:
        return 'info';
    }
  }
}

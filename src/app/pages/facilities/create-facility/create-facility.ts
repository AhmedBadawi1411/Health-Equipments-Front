import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SectionHeader } from '../../../components/section-header/section-header';
import { Select } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { Button, ButtonModule } from 'primeng/button';
import { FacilitiesSerive } from '../../../services/facilities';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputIcon } from 'primeng/inputicon';
import { IconField } from 'primeng/iconfield';
import { FacilityForm } from '../../../interfaces/Facilities.Interface';
import { InventoryStatusPipe } from '../../../pipes/inventory-status-pipe';
import { Tag } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import * as L from 'leaflet';

interface DepartmentForm {
  facilityID: number | undefined;
  departmentName: string | undefined;
}

@Component({
  selector: 'app-create-facility',
  imports: [
    SectionHeader,
    Select,
    ButtonModule,
    TableModule,
    Button,
    FormsModule,
    InputTextModule,
    InputIcon,
    IconField,
    InventoryStatusPipe,
    Tag,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './create-facility.html',
  styleUrl: './create-facility.css',
})
export class CreateFacility implements OnInit, AfterViewInit {
  activeTab = signal<'facility' | 'department'>('facility');

  // --- Facility Form ---
  protected currentFacility: FacilityForm = this.createEmptyFacility();
  protected facilitiesToSave = signal<FacilityForm[]>([]);
  protected isSaving = false;
  protected facilityEditingIndex: number | null = null;

  protected inventoryStatus = [{ name: 'لم تبدا بعد', value: 'NOT_STARTED' }];

  protected facilityTypes = [
    { name: 'مستشفى (Hospital)', value: 'Hospital' },
    { name: 'مركز صحي (Health Center)', value: 'Health Center' },
    { name: 'عيادة (Clinic)', value: 'Clinic' },
    { name: 'مستوصف (Dispensary)', value: 'Dispensary' },
  ];

  protected facilityLevels = [
    { name: 'المستوى 1', value: 1 },
    { name: 'المستوى 2', value: 2 },
    { name: 'المستوى 3', value: 3 },
  ];

  // --- Department Form ---
  protected currentDepartment: DepartmentForm = this.createEmptyDepartment();
  protected departmentsToSave = signal<DepartmentForm[]>([]);
  protected isDeptSaving = false;
  protected deptEditingIndex: number | null = null;

  constructor(
    protected readonly facilitesService: FacilitiesSerive,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.facilitesService.loadFacilities();
    this.facilitesService.loadRegions();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private createEmptyFacility(): FacilityForm {
    return {
      facilityID: undefined,
      facilityName: undefined,
      facilityType: undefined,
      address: undefined,
      facilityLevel: undefined,
      inventoryStatus: 'NOT_STARTED',
      capacity: undefined,
      regionID: undefined,
      lat: undefined,
      lng: undefined,
    };
  }

  private createEmptyDepartment(): DepartmentForm {
    return { facilityID: undefined, departmentName: undefined };
  }

  goBack() {
    this.router.navigate(['/facilities']);
  }

  // ========================= MAP METHODS ========================

  private map: L.Map | null = null;

  private initMap() {
    this.map = L.map('locationPicker').setView([28.5, 17.5], 5);
    L.tileLayer(
      'https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}.jpg?key=Vn2msMKcNgIrOkz1Tspd',
      {
        maxZoom: 19,
      },
    ).addTo(this.map);

    this.map.addEventListener('click', (event: L.LeafletMouseEvent) => {
      this.onMapClicked(event);
      this.drawPoint(this.currentFacility.lat ?? 0, this.currentFacility.lng ?? 0);
      this.cdr.detectChanges();
    });
  }

  protected onLatChanged() {}

  protected onLngChanged() {}

  protected onMapClicked(event: L.LeafletMouseEvent) {
    console.log(event.latlng);
    this.currentFacility.lat = event.latlng.lat;
    this.currentFacility.lng = event.latlng.lng;
  }

  private facilityLocationAnchor: L.Marker | null = null;
  protected drawPoint(lat: number, lng: number) {
    if (this.facilityLocationAnchor) {
      this.map?.removeLayer(this.facilityLocationAnchor);
    }
    if (this.map) {
      this.facilityLocationAnchor = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: '/media/gps.png',
          iconSize: [60,60],
          iconAnchor: [30, 60]
        }),
      }).addTo(this.map);
    }
  }

  protected selectCurrentLocation() {}
  // ======================= FACILITY METHODS =======================
  addFacility() {
    if (
      !this.currentFacility.facilityName ||
      !this.currentFacility.facilityType ||
      this.currentFacility.facilityLevel === undefined ||
      this.currentFacility.capacity === undefined ||
      !this.currentFacility.regionID
    ) {
      this.toast.add({
        severity: 'error',
        summary: 'خطأ في التحقق',
        detail: 'يرجى ملء جميع الحقول الإلزامية.',
      });
      return;
    }

    if (this.facilityEditingIndex !== null) {
      const facilities = [...this.facilitiesToSave()];
      facilities[this.facilityEditingIndex] = { ...this.currentFacility };
      this.facilitiesToSave.set(facilities);
      this.facilityEditingIndex = null;
    } else {
      this.facilitiesToSave.set([...this.facilitiesToSave(), { ...this.currentFacility }]);
    }

    const savedRegion = this.currentFacility.regionID;
    const savedType = this.currentFacility.facilityType;
    this.currentFacility = this.createEmptyFacility();
    this.currentFacility.regionID = savedRegion;
    this.currentFacility.facilityType = savedType;
  }

  deleteFacilityItem(index: number) {
    this.facilitiesToSave.set(this.facilitiesToSave().filter((_, i) => i !== index));
    if (this.facilityEditingIndex === index) {
      this.facilityEditingIndex = null;
      this.currentFacility = this.createEmptyFacility();
    }
  }

  editFacilityItem(index: number) {
    this.facilityEditingIndex = index;
    const item = this.facilitiesToSave()[index];
    if (item) this.currentFacility = { ...item };
  }

  saveAllFacilities() {
    const facilities = this.facilitiesToSave();
    if (facilities.length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'قائمة فارغة',
        detail: 'يرجى إضافة منشأة واحدة على الأقل.',
      });
      return;
    }
    this.isSaving = true;
    const requests = facilities.map((f) =>
      this.facilitesService.createFacility({
        facilityName: f.facilityName!,
        facilityType: f.facilityType!,
        address: f.address || undefined,
        facilityLevel: Number(f.facilityLevel),
        capacity: Number(f.capacity),
        lat: Number(f.lat),
        lng: Number(f.lng),
        regionID: Number(f.regionID),
        inventoryStatus: f.inventoryStatus || 'NOT_STARTED',
      }),
    );
    forkJoin(requests).subscribe({
      next: (responses) => {
        this.toast.add({
          severity: 'success',
          summary: 'تم الحفظ بنجاح',
          detail: `تم إضافة ${responses.length} منشأة بنجاح.`,
        });
        this.facilitiesToSave.set([]);
        this.facilitesService.loadFacilities(true);
        setTimeout(() => {
          this.isSaving = false;
          this.router.navigate(['/facilities']);
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.toast.add({
          severity: 'error',
          summary: 'فشل الحفظ',
          detail: err.error?.message || 'حدث خطأ أثناء حفظ الجهات.',
        });
      },
    });
  }

  // ======================= DEPARTMENT METHODS =======================
  addDepartment() {
    if (!this.currentDepartment.facilityID || !this.currentDepartment.departmentName?.trim()) {
      this.toast.add({
        severity: 'error',
        summary: 'خطأ في التحقق',
        detail: 'يرجى اختيار الجهة وإدخال اسم القسم.',
      });
      return;
    }
    if (this.deptEditingIndex !== null) {
      const depts = [...this.departmentsToSave()];
      depts[this.deptEditingIndex] = { ...this.currentDepartment };
      this.departmentsToSave.set(depts);
      this.deptEditingIndex = null;
    } else {
      this.departmentsToSave.set([...this.departmentsToSave(), { ...this.currentDepartment }]);
    }
    const savedFacility = this.currentDepartment.facilityID;
    this.currentDepartment = this.createEmptyDepartment();
    this.currentDepartment.facilityID = savedFacility;
  }

  deleteDeptItem(index: number) {
    this.departmentsToSave.set(this.departmentsToSave().filter((_, i) => i !== index));
    if (this.deptEditingIndex === index) {
      this.deptEditingIndex = null;
      this.currentDepartment = this.createEmptyDepartment();
    }
  }

  editDeptItem(index: number) {
    this.deptEditingIndex = index;
    const item = this.departmentsToSave()[index];
    if (item) this.currentDepartment = { ...item };
  }

  saveAllDepartments() {
    const depts = this.departmentsToSave();
    if (depts.length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'قائمة فارغة',
        detail: 'يرجى إضافة قسم واحد على الأقل.',
      });
      return;
    }
    this.isDeptSaving = true;
    const requests = depts.map((d) =>
      this.facilitesService.createDepartment({
        departmentName: d.departmentName!,
        facilityID: Number(d.facilityID),
      }),
    );
    forkJoin(requests).subscribe({
      next: (responses) => {
        this.toast.add({
          severity: 'success',
          summary: 'تم الحفظ بنجاح',
          detail: `تم إضافة ${responses.length} أقسام بنجاح.`,
        });
        this.departmentsToSave.set([]);
        this.isDeptSaving = false;
      },
      error: (err) => {
        this.isDeptSaving = false;
        this.toast.add({
          severity: 'error',
          summary: 'فشل الحفظ',
          detail: err.error?.message || 'حدث خطأ أثناء حفظ الأقسام.',
        });
      },
    });
  }
}

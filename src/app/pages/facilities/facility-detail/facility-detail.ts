import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';

import { FacilitiesSerive } from '../../../services/facilities';
import { IFacility, FacilityForm } from '../../../interfaces/Facilities.Interface';
import { SectionHeader } from '../../../components/section-header/section-header';

import * as L from 'leaflet';

@Component({
  selector: 'app-facility-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    Select,
    Checkbox,
    ToastModule,
    SectionHeader,
    IconField,
    InputIcon,
  ],
  providers: [MessageService],
  templateUrl: './facility-detail.html',
  styleUrls: ['./facility-detail.css'],
})
export class FacilityDetail implements OnInit, AfterViewInit {
  facilityId!: number;
  facility = signal<IFacility | null>(null);
  isSaving = false;

  profileForm: FacilityForm = {
    facilityName: '',
    facilityType: '',
    address: '',
    facilityLevel: 1,
    capacity: 0,
    regionID: undefined,
    inventoryStatus: 'NOT_STARTED',
    isApproved: false,
  };

  facilityTypes = [
    { name: 'مستشفى (Hospital)', value: 'Hospital' },
    { name: 'مركز صحي (Health Center)', value: 'Health Center' },
    { name: 'عيادة (Clinic)', value: 'Clinic' },
    { name: 'مستوصف (Dispensary)', value: 'Dispensary' },
  ];

  facilityLevels = [
    { name: 'المستوى 1', value: 1 },
    { name: 'المستوى 2', value: 2 },
    { name: 'المستوى 3', value: 3 },
  ];

  inventoryStatusOptions = [
    { name: 'لم تبدأ بعد', value: 'NOT_STARTED' },
    { name: 'قيد التنفيذ', value: 'IN_PROGRESS' },
    { name: 'تم التقديم', value: 'SUBMITTED' },
    { name: 'تمت الموافقة', value: 'APPROVED' },
    { name: 'مرفوض', value: 'REJECTED' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    protected readonly facilitiesService: FacilitiesSerive,
    private readonly router: Router,
    private readonly toast: MessageService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'معرف الجهة غير صحيح' });
      this.goBack();
      return;
    }
    this.facilityId = Number(idParam);

    this.facilitiesService.loadRegions();
    this.facilitiesService.loadFacilities();
    this.loadFacilityData();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }
  // ========================= MAP METHODS ========================

  private map: L.Map | null = null;

  private initMap() {
    this.map = L.map('locationPicker2').setView([28.5, 17.5], 5);
    L.tileLayer(
      'https://api.maptiler.com/maps/hybrid-v4/256/{z}/{x}/{y}.jpg?key=Vn2msMKcNgIrOkz1Tspd',
      {
        maxZoom: 19,
      },
    ).addTo(this.map);

    this.map.addEventListener('click', (event: L.LeafletMouseEvent) => {
      this.onMapClicked(event);
      this.drawPoint(this.profileForm.lat ?? 0, this.profileForm.lng ?? 0);
      this.cdr.detectChanges();
    });
  }

  protected onLatChanged() {}

  protected onLngChanged() {}

  protected onMapClicked(event: L.LeafletMouseEvent) {
    console.log(event.latlng);
    this.profileForm.lat = event.latlng.lat;
    this.profileForm.lng = event.latlng.lng;
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
          iconSize: [60, 60],
          iconAnchor: [30, 60],
        }),
      }).addTo(this.map);
    }
  }

  protected selectCurrentLocation() {}

  loadFacilityData(): void {
    this.facilitiesService.getFacility(this.facilityId).subscribe({
      next: (res) => {
        if (res.data) {
          const f = res.data;
          this.facility.set(f);
          this.profileForm = {
            facilityName: f.facilityName,
            facilityType: f.facilityType,
            address: f.address || '',
            facilityLevel: f.facilityLevel,
            capacity: f.capacity,
            regionID: f.regionID,
            inventoryStatus: f.inventoryStatus,
            isApproved: f.isApproved,
          };
        }
      },
      error: (err) => {
        console.error('Failed to load facility data:', err);
        this.toast.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل تحميل بيانات الجهة الصحية',
        });
      },
    });
  }

  saveProfile(): void {
    if (
      !this.profileForm.facilityName?.trim() ||
      !this.profileForm.facilityType ||
      this.profileForm.facilityLevel === undefined ||
      this.profileForm.capacity === undefined ||
      !this.profileForm.regionID
    ) {
      this.toast.add({
        severity: 'error',
        summary: 'خطأ في التحقق',
        detail: 'يرجى ملء جميع الحقول الإلزامية',
      });
      return;
    }

    this.isSaving = true;
    const payload: FacilityForm = {
      facilityName: this.profileForm.facilityName,
      facilityType: this.profileForm.facilityType,
      address: this.profileForm.address || undefined,
      facilityLevel: Number(this.profileForm.facilityLevel),
      capacity: Number(this.profileForm.capacity),
      regionID: Number(this.profileForm.regionID),
      inventoryStatus: this.profileForm.inventoryStatus,
      isApproved: !!this.profileForm.isApproved,
    };

    this.facilitiesService.updateFacility(this.facilityId, payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.toast.add({
          severity: 'success',
          summary: 'نجاح',
          detail: 'تم تحديث بيانات الجهة الصحية بنجاح',
        });
        this.facilitiesService.loadFacilities(true);
        setTimeout(() => {
          this.goBack();
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        this.toast.add({
          severity: 'error',
          summary: 'خطأ في الحفظ',
          detail: err.error?.message || 'حدث خطأ أثناء حفظ التعديلات',
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/facilities']);
  }
}

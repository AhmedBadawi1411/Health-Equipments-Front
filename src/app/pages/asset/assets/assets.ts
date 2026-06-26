import { Component, OnInit, computed } from '@angular/core';
import { SectionHeader } from "../../../components/section-header/section-header";
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetsService } from '../../../services/assets';
import { FacilitiesSerive } from '../../../services/facilities';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CommonModule } from '@angular/common';
import { SelectWithLabel } from '../../../components/select-with-label/select-with-label';
import { TextBoxWithLabel } from '../../../components/text-box-with-label/text-box-with-label';
import { AssetsHelperService } from '../../../services/assets-helpers';

@Component({
  selector: 'app-assets',
  imports: [
    SectionHeader, 
    TableModule, 
    ButtonModule, 
    ToastModule, 
    CommonModule, 
    SelectWithLabel, 
    TextBoxWithLabel
  ],
  providers: [MessageService],
  templateUrl: './assets.html',
  styleUrl: './assets.css',
})
export class Assets implements OnInit {
  searchText = '';
  selectedFacility: any = null;
  selectedStatus: any = null;
  selectedType: any = null;
  selectedSupplier: any = null;

  equipmentStatusMap = new Map<number, string>([
    [2, 'نشط'],
    [3, 'غير نشط'],
    [4, 'قيد الصيانة'],
    [5, 'خارج الخدمة مؤقتا'],
    [6, 'خارج الخدمة نهائيا'],
  ]);

  statusOptions = [
    { name: 'نشط', value: 2 },
    { name: 'غير نشط', value: 3 },
    { name: 'قيد الصيانة', value: 4 },
    { name: 'خارج الخدمة مؤقتا', value: 5 },
    { name: 'خارج الخدمة نهائيا', value: 6 },
  ];

  facilityOptions = computed(() => {
    return this.facilitiesService.facilities().map(f => ({
      name: f.facilityName,
      value: f.facilityID
    }));
  });

  typeOptions = computed(() => {
    return this.assetsService.assetMaster().map(t => ({
      name: t.equipmentName,
      value: t.equipmentTypeId
    }));
  });

  supplierOptions = computed(() => {
    return this.assetsHelper.suppliers().map(s => ({
      name: s.supplierName,
      value: s.supplierId
    }));
  });

  filteredAssets() {
    let list = this.assetsService.assets();
    const search = this.searchText.trim().toLowerCase();
    const facilityId = this.selectedFacility?.value;
    const statusId = this.selectedStatus?.value;
    const typeId = this.selectedType?.value;
    const supplierId = this.selectedSupplier?.value;

    if (search) {
      list = list.filter(a => {
        const serial = (a.serialNumber || '').toLowerCase();
        const id = (a.assetId || '').toString();
        const equipmentName = (this.assetsService.assetMasterMap().get(a.equipmentTypeId) || '').toLowerCase();
        const supplierName = (this.assetsHelper.suppliersMap().get(a.supplierId!) || '').toLowerCase();
        return serial.includes(search) || id.includes(search) || equipmentName.includes(search) || supplierName.includes(search);
      });
    }
    if (facilityId) {
      list = list.filter(a => a.facilityId === facilityId);
    }
    if (statusId) {
      list = list.filter(a => a.statusId === statusId);
    }
    if (typeId) {
      list = list.filter(a => a.equipmentTypeId === typeId);
    }
    if (supplierId) {
      list = list.filter(a => a.supplierId === supplierId);
    }
    return list;
  }

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    protected readonly assetsService: AssetsService,
    protected readonly facilitiesService: FacilitiesSerive,
    protected readonly assetsHelper: AssetsHelperService,
    private readonly toast: MessageService
  ) {}

  ngOnInit() {
    this.assetsService.loadAssets();
    this.assetsService.loadAssetMaster();
    this.facilitiesService.loadFacilities();
    this.assetsHelper.loadSuppliers();

    // Pre-filtering query param
    this.route.queryParams.subscribe(params => {
      const facilityIdParam = params['facilityId'];
      if (facilityIdParam) {
        const facilityId = Number(facilityIdParam);
        setTimeout(() => {
          const matchedFacility = this.facilitiesService.facilities().find(f => f.facilityID === facilityId);
          if (matchedFacility) {
            this.selectedFacility = { name: matchedFacility.facilityName, value: matchedFacility.facilityID };
          }
        }, 400);
      }
    });
  }

  onAdd() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  editAsset(id: number) {
    this.router.navigate(['edit', id], { relativeTo: this.route });
  }

  deleteAsset(id: number) {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الأصل؟')) {
      this.assetsService.deleteAsset(id).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'تم بنجاح', detail: 'تم حذف الأصل بنجاح' });
          this.assetsService.loadAssets(true);
        },
        error: (err) => {
          console.error('Failed to delete asset:', err);
          this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حذف الأصل' });
        }
      });
    }
  }

  resetFilters() {
    this.searchText = '';
    this.selectedFacility = null;
    this.selectedStatus = null;
    this.selectedType = null;
    this.selectedSupplier = null;
  }
}

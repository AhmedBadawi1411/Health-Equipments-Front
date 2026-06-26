import { Component, computed, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { SelectWithLabel } from '../../components/select-with-label/select-with-label';
import { TextBoxWithLabel } from '../../components/text-box-with-label/text-box-with-label';
import { SectionHeader } from '../../components/section-header/section-header';
import { FacilitiesSerive } from '../../services/facilities';
import { ActivatedRoute, Router } from '@angular/router';
import { TagModule } from 'primeng/tag';
import { INVENTORY_STATUS } from '../../shared/constants/sharedIndex';
import { InventoryStatusPipe } from '../../pipes/inventory-status-pipe';
import { Button } from 'primeng/button';
import { Menu } from 'primeng/menu';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-facilities',
  imports: [
    TagModule,
    TableModule,
    SelectWithLabel,
    TextBoxWithLabel,
    SectionHeader,
    InventoryStatusPipe,
    Button,
    Menu,
    ToastModule,
    CommonModule
  ],
  providers: [MessageService],
  templateUrl: './facilities.html',
  styleUrl: './facilities.css',
})
export class Facilities {
  searchText = '';
  selectedType: any = null;
  selectedStatus: any = null;
  selectedRegion: any = null;

  typeOptions = [
    { name: 'مستشفى', value: 'Hospital' },
    { name: 'مركز صحي', value: 'Health Center' },
    { name: 'عيادة', value: 'Clinic' },
    { name: 'مستوصف', value: 'Dispensary' }
  ];

  statusOptions = [
    { name: 'لم تبدأ بعد', value: 'NOT_STARTED' },
    { name: 'قيد التنفيذ', value: 'IN_PROGRESS' },
    { name: 'تم التقديم', value: 'SUBMITTED' },
    { name: 'تمت الموافقة', value: 'APPROVED' },
    { name: 'مرفوض', value: 'REJECTED' }
  ];

  regionOptions = computed(() => {
    return this.facilitiesService.regions().map(r => ({
      name: r.regionName,
      value: r.regionID
    }));
  });

  filteredFacilities() {
    let list = this.facilitiesService.facilities();
    const search = this.searchText.trim().toLowerCase();
    const type = this.selectedType?.value;
    const status = this.selectedStatus?.value;
    const region = this.selectedRegion?.value;

    if (search) {
      list = list.filter(f => 
        f.facilityName.toLowerCase().includes(search) || 
        f.facilityID.toString().includes(search) || 
        (f.address && f.address.toLowerCase().includes(search))
      );
    }
    if (type) {
      list = list.filter(f => f.facilityType === type);
    }
    if (status) {
      list = list.filter(f => f.inventoryStatus === status);
    }
    if (region) {
      list = list.filter(f => f.regionID === region);
    }
    return list;
  }

  activeItem: any = null;
  menuItems = [
    {
      label: 'عرض التفاصيل / تعديل',
      icon: 'pi pi-pencil',
      command: () => {
        if (this.activeItem) {
          this.editFacility(this.activeItem.facilityID);
        }
      }
    },
    {
      label: 'عرض الأصول',
      icon: 'pi pi-desktop',
      command: () => {
        if (this.activeItem) {
          this.router.navigate(['/assets'], { queryParams: { facilityId: this.activeItem.facilityID } });
        }
      }
    },
    {
      label: 'بدء الجرد',
      icon: 'pi pi-clipboard',
      command: () => {
        if (this.activeItem) {
          this.router.navigate(['/inventory'], { queryParams: { facilityId: this.activeItem.facilityID } });
        }
      }
    },
    {
      label: 'حذف الجهة',
      icon: 'pi pi-trash',
      command: () => {
        if (this.activeItem) {
          this.toastService.add({
            severity: 'warn',
            summary: 'لا يمكن الحذف',
            detail: 'عذرا، لا يمكن حذف هذه الجهة لوجود أصول طبية مرتبطة بها حاليا'
          });
        }
      }
    }
  ];

  constructor(
    protected facilitiesService: FacilitiesSerive,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: MessageService
  ) {}

  INVENTORY_STATUS = INVENTORY_STATUS;

  cols = [
    { field: 'facilityID', header: 'الرقم التعريفي' },
    { field: 'regionID', header: 'المنطقة' },
    { field: 'facilityName', header: 'الاسم' },
    { field: 'facilityType', header: 'النوع' },
    { field: 'address', header: 'العنوان' },
    { field: 'facilityLevel', header: 'المستوي' },
    { field: 'capacity', header: 'السعة' },
    { field: 'inventoryStatus', header: 'الحالة' },
  ];

  onAdd() {
    this.router.navigate(['create'], { relativeTo: this.route });
  }

  editFacility(id: number) {
    this.router.navigate(['edit', id], { relativeTo: this.route });
  }

  resetFilters() {
    this.searchText = '';
    this.selectedType = null;
    this.selectedStatus = null;
    this.selectedRegion = null;
  }
}

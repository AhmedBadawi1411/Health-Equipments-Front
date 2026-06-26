import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionHeader } from '../../components/section-header/section-header';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { ButtonModule, Button } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tag } from 'primeng/tag';
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import {
  IInventorySurvey,
  IInventorySurveyItem,
  IInventorySurveyItemForm,
} from '../../interfaces/Inventory.interface';
import { FacilitiesSerive } from '../../services/facilities';
import { AssetsService } from '../../services/assets';
import { InventoryService } from '../../services/inventory.service';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SectionHeader,
    Select,
    DatePicker,
    TableModule,
    ButtonModule,
    Button,
    InputTextModule,
    IconField,
    InputIcon,
    Tag,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.css'],
})
export class InventoryComponent implements OnInit {
  viewMode = signal<'list' | 'create' | 'edit' | 'view'>('list');

  selectedSurveyId: number | null = null;
  surveyFacilityId: number | undefined = undefined;
  surveyDate: Date | undefined = undefined;
  surveyType: string = 'دوري';
  notes: string = '';

  surveyTypes = [
    { name: 'حصر دوري', value: 'دوري' },
    { name: 'حصر طارئ', value: 'طارئ' },
    { name: 'حصر سنوي', value: 'سنوي' },
  ];

  isSubmitting = false;

  equipmentStatusList = [
    { name: 'نشط / يعمل', value: 'ACTIVE' },
    { name: 'غير نشط / معطل', value: 'INACTIVE' },
    { name: 'تحت الصيانة', value: 'UNDER_MAINTENANCE' },
    { name: 'خارج الخدمة نهائيا', value: 'OUT_OF_SERVICE' },
  ];

  equipmentStatusMap = new Map<
    string,
    { label: string; severity: 'success' | 'warn' | 'danger' | 'secondary' | 'info' }
  >([
    ['ACTIVE', { label: 'نشط / يعمل', severity: 'success' }],
    ['INACTIVE', { label: 'غير نشط / معطل', severity: 'danger' }],
    ['UNDER_MAINTENANCE', { label: 'تحت الصيانة', severity: 'warn' }],
    ['OUT_OF_SERVICE', { label: 'خارج الخدمة نهائيا', severity: 'info' }],
  ]);

  currentItem: IInventorySurveyItemForm = this.createEmptyItem();
  surveyItems = signal<IInventorySurveyItem[]>([]);
  editingItemIndex: number | null = null;

  serialLookupDone = false;

  constructor(
    protected readonly facilitiesService: FacilitiesSerive,
    protected readonly assetsService: AssetsService,
    protected readonly inventoryService: InventoryService,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toast: MessageService,
  ) {}

  ngOnInit(): void {
    this.inventoryService.loadSurveys();
    this.facilitiesService.loadFacilities();
    this.assetsService.loadAssetMaster();
  }

  private createEmptyItem(): IInventorySurveyItemForm {
    return {
      departmentID: undefined,
      isExistingAsset: false,
      assetID: null,
      equipmentMasterID: null,
      equipmentNameSnapshot: '',
      serialNumberSnapshot: '',
      statusSnapshot: 'ACTIVE',
      quantity: 1,
      needRegistration: false,
      remarks: '',
    };
  }

  private resetItemForm(): void {
    this.currentItem = this.createEmptyItem();
    this.serialLookupDone = false;
    this.editingItemIndex = null;
  }

  onFacilityChange(facilityId: number): void {
    if (facilityId) {
      this.facilitiesService.loadDepartments(facilityId);
    }
    this.surveyItems.set([]);
    this.resetItemForm();
  }

  checkSerial(): void {
    if (!this.surveyFacilityId || !this.currentItem.serialNumberSnapshot?.trim() || !this.currentItem.departmentID) {
      return;
    }
    const facilityId = this.surveyFacilityId;
    this.assetsService
      .searchAssetBySerial(facilityId, this.currentItem.serialNumberSnapshot)
      .subscribe((asset) => {
        this.serialLookupDone = true;
        if (asset) {
          this.currentItem.assetID = asset.assetId;
          this.currentItem.equipmentNameSnapshot = asset.equipmentName;
          this.currentItem.needRegistration = false;
          this.currentItem.isExistingAsset = true;
        } else {
          this.currentItem.assetID = null;
          this.currentItem.equipmentNameSnapshot = '';
          this.currentItem.needRegistration = true;
          this.currentItem.isExistingAsset = false;
        }
      });
  }


  onEquipmentTypeSelected(equipmentTypeId: number | null): void {
    if (!equipmentTypeId) {
      this.currentItem.equipmentNameSnapshot = '';
      return;
    }
    const master = this.assetsService
      .assetMaster()
      .find((a) => a.equipmentTypeId === equipmentTypeId);
    if (master) {
      this.currentItem.equipmentNameSnapshot = master.equipmentName;
    }
  }

  addItem(): void {

    const hasName = !!this.currentItem.equipmentNameSnapshot?.trim();
    if (
      !this.currentItem.departmentID ||
      !hasName ||
      !this.currentItem.quantity ||
      this.currentItem.quantity <= 0
    ) {
      return;
    }

    const newItem: IInventorySurveyItem = {
      surveyItemID: this.currentItem.surveyItemID,
      surveyID: this.selectedSurveyId || undefined,
      assetID: this.currentItem.assetID,
      equipmentMasterID: this.currentItem.equipmentMasterID,
      equipmentNameSnapshot: this.currentItem.equipmentNameSnapshot!,
      serialNumberSnapshot: this.currentItem.serialNumberSnapshot || null,
      departmentID: this.currentItem.departmentID!,
      statusSnapshot: this.currentItem.statusSnapshot || 'ACTIVE',
      quantity: this.currentItem.quantity,
      needRegistration: !!this.currentItem.needRegistration,
      remarks: this.currentItem.remarks || null,
    };

    if (this.editingItemIndex !== null) {
      const items = [...this.surveyItems()];
      items[this.editingItemIndex] = newItem;
      this.surveyItems.set(items);
    } else {
      this.surveyItems.set([...this.surveyItems(), newItem]);
    }

    this.resetItemForm();
  }

  editItem(index: number): void {
    this.editingItemIndex = index;
    const item = this.surveyItems()[index];
    this.currentItem = {
      surveyItemID: item.surveyItemID,
      surveyID: item.surveyID,
      assetID: item.assetID,
      isExistingAsset: !item.needRegistration,
      equipmentNameSnapshot: item.equipmentNameSnapshot,
      serialNumberSnapshot: item.serialNumberSnapshot,
      departmentID: item.departmentID,
      statusSnapshot: item.statusSnapshot,
      quantity: item.quantity,
      needRegistration: item.needRegistration,
      remarks: item.remarks,
    };
    this.serialLookupDone = !!item.serialNumberSnapshot;
  }

  deleteItem(index: number): void {
    this.surveyItems.set(this.surveyItems().filter((_, i) => i !== index));
    if (this.editingItemIndex === index) {
      this.resetItemForm();
    }
  }

  switchToCreate(): void {
    this.viewMode.set('create');
    this.selectedSurveyId = null;
    this.surveyFacilityId = undefined;
    this.surveyDate = new Date();
    this.surveyType = 'دوري';
    this.notes = '';
    this.surveyItems.set([]);
    this.resetItemForm();
  }

  switchToEdit(survey: IInventorySurvey): void {
    this.viewMode.set('edit');
    const surveyId = survey.surveyID || (survey as any).surveyId || null;
    const facilityId = survey.facilityID || (survey as any).facilityId;
    this.selectedSurveyId = surveyId;
    this.surveyFacilityId = facilityId;
    this.surveyDate = survey.surveyDate ? new Date(survey.surveyDate) : new Date();
    this.surveyType = survey.surveyType;
    this.notes = survey.notes || '';

    const normalizedItems = (survey.items || []).map((item) => ({
      ...item,
      surveyItemID: item.surveyItemID || (item as any).surveyItemId,
      surveyID: item.surveyID || (item as any).surveyId,
      assetID: item.assetID !== undefined ? item.assetID : (item as any).assetId,
      departmentID: item.departmentID || (item as any).departmentId,
    }));

    this.surveyItems.set(normalizedItems);
    this.resetItemForm();
    if (facilityId) {
      this.facilitiesService.loadDepartments(facilityId);
    }
  }

  switchToView(survey: IInventorySurvey): void {
    this.viewMode.set('view');
    const surveyId = survey.surveyID || (survey as any).surveyId || null;
    const facilityId = survey.facilityID || (survey as any).facilityId;
    this.selectedSurveyId = surveyId;
    this.surveyFacilityId = facilityId;
    this.surveyDate = survey.surveyDate ? new Date(survey.surveyDate) : new Date();
    this.surveyType = survey.surveyType;
    this.notes = survey.notes || '';

    const normalizedItems = (survey.items || []).map((item) => ({
      ...item,
      surveyItemID: item.surveyItemID || (item as any).surveyItemId,
      surveyID: item.surveyID || (item as any).surveyId,
      assetID: item.assetID !== undefined ? item.assetID : (item as any).assetId,
      departmentID: item.departmentID || (item as any).departmentId,
    }));

    this.surveyItems.set(normalizedItems);
    this.resetItemForm();
    if (facilityId) {
      this.facilitiesService.loadDepartments(facilityId);
    }
  }

  registerUnregisteredAsset(item: IInventorySurveyItem): void {
    const facilityId = this.surveyFacilityId;
    const deptId = item.departmentID || (item as any).departmentId;
    const assetId = item.assetID !== undefined ? item.assetID : (item as any).assetId;
    const serial = item.serialNumberSnapshot;
    const surveyItemId = item.surveyItemID || (item as any).surveyItemId;

    this.router.navigate(['/assets/create'], {
      queryParams: {
        facilityId: facilityId,
        departmentId: deptId,
        serial: serial || '',
        assetType: assetId || '',
        surveyItemId: surveyItemId || ''
      }
    });
  }

  registerAllUnregisteredAssets(): void {
    const surveyId = this.selectedSurveyId;
    if (!surveyId) return;
    this.router.navigate(['/assets/create'], {
      queryParams: {
        surveyId: surveyId
      }
    });
  }

  hasUnregisteredItems(): boolean {
    return this.surveyItems().some(item => item.needRegistration);
  }

  switchToList(): void {
    this.viewMode.set('list');
  }

  saveSurvey(): void {
    if (!this.surveyFacilityId) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى اختيار الجهة الصحية' });
      return;
    }
    if (!this.surveyDate) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى اختيار تاريخ الحصر' });
      return;
    }
    if (this.surveyItems().length === 0) {
      this.toast.add({
        severity: 'error',
        summary: 'خطأ',
        detail: 'يرجى إضافة جهاز واحد على الأقل للجدول',
      });
      return;
    }

    this.isSubmitting = true;
    const payload: IInventorySurvey = {
      facilityID: Number(this.surveyFacilityId),
      surveyDate: this.surveyDate.toISOString(),
      surveyType: this.surveyType,
      status: this.selectedSurveyId ? 'IN_PROGRESS' : 'SUBMITTED',
      createdBy: this.authService.user()?.name || 'مدير النظام',
      notes: this.notes || '',
      items: this.surveyItems(),
    };

    console.log(payload);

    if (this.selectedSurveyId) {
      this.inventoryService.updateSurvey(this.selectedSurveyId, payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم تحديث عملية الحصر بنجاح',
          });
          this.inventoryService.loadSurveys(true);
          this.switchToList();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to update survey:', err);
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: err.error?.message || 'فشل تحديث عملية الحصر',
          });
        },
      });
    } else {
      this.inventoryService.createSurvey(payload).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.toast.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم حفظ عملية الحصر بنجاح',
          });
          this.inventoryService.loadSurveys(true);
          this.switchToList();
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Failed to create survey:', err);
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: err.error?.message || 'فشل حفظ عملية الحصر',
          });
        },
      });
    }
  }

  deleteSurvey(id: number): void {
    if (confirm('هل أنت متأكد من رغبتك في حذف عملية الحصر هذه؟')) {
      this.inventoryService.deleteSurvey(id).subscribe({
        next: () => {
          this.toast.add({
            severity: 'success',
            summary: 'تم بنجاح',
            detail: 'تم حذف عملية الحصر بنجاح',
          });
          this.inventoryService.loadSurveys(true);
        },
        error: (err) => {
          console.error('Failed to delete survey:', err);
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: err.error?.message || 'فشل حذف عملية الحصر',
          });
        },
      });
    }
  }
}

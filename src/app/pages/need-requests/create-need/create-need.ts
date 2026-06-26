import { Component, OnInit, signal, effect } from '@angular/core';
import { SectionHeader } from '../../../components/section-header/section-header';
import { Select } from 'primeng/select';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { TableModule } from 'primeng/table';
import { Button, ButtonModule } from 'primeng/button';
import { FacilitiesSerive } from '../../../services/facilities';
import { AssetsService } from '../../../services/assets';
import { NeedsService } from '../../../services/needs.service';
import { AuthService } from '../../../services/auth-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  INeedRequest,
  INeedRequestItemForm,
} from '../../../interfaces/NeedRequest.interface';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-create-need',
  imports: [
    SectionHeader,
    Select,
    IconField,
    InputIcon,
    TableModule,
    ButtonModule,
    Button,
    CommonModule,
    FormsModule,
    InputTextModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './create-need.html',
  styleUrl: './create-need.css',
})
export class CreateNeed implements OnInit {
  // Edit mode
  editMode = false;
  editRequestId: number | null = null;

  selectedFacilityId: number | undefined = undefined;
  requestedBy: string = '';
  selectedDepartmentId: number | undefined = undefined;
  isSaving = false;

  currentItem: INeedRequestItemForm = this.createEmptyNeedItem();
  requestItems = signal<INeedRequestItemForm[]>([]);
  editingIndex: number | null = null;

  constructor(
    protected readonly facilitesService: FacilitiesSerive,
    protected readonly assetsService: AssetsService,
    private readonly needsService: NeedsService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly toast: MessageService,
    private readonly authService: AuthService
  ) {
    effect(() => {
      const facilities = this.facilitesService.facilities();
      const selectedId = this.selectedFacilityId;
      if (selectedId && facilities.length > 0) {
        this.checkFacilityLock(selectedId);
      }
    });
  }

  ngOnInit(): void {
    this.facilitesService.loadFacilities();
    this.assetsService.loadAssetMaster();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.editRequestId = Number(id);
      this.loadRequestForEdit(this.editRequestId);
    }
  }

  private checkFacilityLock(facilityId: number): boolean {
    const facility = this.facilitesService.facilities().find(f => f.facilityID === facilityId);
    console.log("FACILITY: checkFacilityLock",  facility);
    
    if (facility) {
      if (facility.inventoryStatus !== 'APPROVED') {
        this.needsService.pendingLockMessage = true;
        this.navigateBack();
        return false;
      }
    }
    return true;
  }

  private loadRequestForEdit(id: number) {
    this.needsService.getNeedRequestById(id).subscribe({
      next: (res) => {
        const req = res.data;
        this.selectedDepartmentId = req.departmentId;
        this.requestedBy = req.requestedBy;

        // Load the departments for the selected department's facility
        if (req.department?.facilityID) {
          this.selectedFacilityId = req.department.facilityID;
          this.checkFacilityLock(req.department.facilityID);
          this.facilitesService.loadDepartments(req.department.facilityID);
        }

        this.requestItems.set(
          (req.items || []).map((item: any) => ({
            equipmentTypeId: item.equipmentTypeId,
            quantity: item.quantity,
            justification: item.justification || '',
          }))
        );
      },
      error: (err) => {
        console.error('Failed to load request for edit:', err);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل بيانات الطلب للتعديل' });
      }
    });
  }

  private createEmptyNeedItem(): INeedRequestItemForm {
    return {
      equipmentTypeId: undefined,
      quantity: undefined,
      justification: '',
    };
  }

  onFacilityChange(facilityId: number) {
    if (facilityId) {
      if (!this.checkFacilityLock(facilityId)) {
        return;
      }
      this.facilitesService.loadDepartments(facilityId);
      this.selectedDepartmentId = undefined;
    }
  }

  addItem() {
    if (!this.currentItem.equipmentTypeId || !this.currentItem.quantity || this.currentItem.quantity <= 0) {
      return;
    }

    if (this.editingIndex !== null) {
      const items = [...this.requestItems()];
      items[this.editingIndex] = { ...this.currentItem };
      this.requestItems.set(items);
      this.editingIndex = null;
    } else {
      this.requestItems.set([...this.requestItems(), { ...this.currentItem }]);
    }

    this.currentItem = this.createEmptyNeedItem();
  }

  deleteItem(index: number) {
    this.requestItems.set(this.requestItems().filter((_, i) => i !== index));
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.currentItem = this.createEmptyNeedItem();
    }
  }

  editItem(index: number) {
    this.editingIndex = index;
    const item = this.requestItems().find((_, i) => i === index);
    this.currentItem = item ? { ...item } : this.createEmptyNeedItem();
  }

  saveRequest() {
    if (!this.selectedDepartmentId) {
      this.toast.add({ severity: 'error', summary: 'خطأ في التحقق', detail: 'يرجى اختيار القسم / الإدارة' });
      return;
    }
    if (!this.requestedBy?.trim()) {
      this.toast.add({ severity: 'error', summary: 'خطأ في التحقق', detail: 'يرجى إدخال اسم مقدم الطلب' });
      return;
    }
    if (this.requestItems().length === 0) {
      this.toast.add({ severity: 'error', summary: 'خطأ في التحقق', detail: 'يرجى إضافة جهاز واحد على الأقل للطلب' });
      return;
    }

    this.isSaving = true;
    const payload: INeedRequest = {
      departmentId: Number(this.selectedDepartmentId),
      requestedBy: this.requestedBy,
      items: this.requestItems().map(item => ({
        equipmentTypeId: item.equipmentTypeId!,
        quantity: item.quantity!,
        justification: item.justification || ''
      }))
    };

    if (this.editMode && this.editRequestId !== null) {
      this.needsService.updateNeedRequest(this.editRequestId, payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'تم بنجاح', detail: 'تم تحديث طلب الاحتياج بنجاح' });
          this.needsService.loadNeedRequests(true);
          setTimeout(() => {
            this.isSaving = false;
            this.navigateBack();
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.toast.add({ severity: 'error', summary: 'خطأ في الحفظ', detail: err.error?.message || 'فشل تحديث طلب الاحتياج' });
        }
      });
    } else {
      this.needsService.createNeedRequest(payload).subscribe({
        next: () => {
          this.toast.add({ severity: 'success', summary: 'تم بنجاح', detail: 'تم حفظ طلب الاحتياج بنجاح' });
          this.needsService.loadNeedRequests(true);
          setTimeout(() => {
            this.isSaving = false;
            this.navigateBack();
          }, 1500);
        },
        error: (err) => {
          this.isSaving = false;
          this.toast.add({ severity: 'error', summary: 'خطأ في الحفظ', detail: err.error?.message || 'فشل حفظ طلب الاحتياج' });
        }
      });
    }
  }

  navigateBack() {
    this.router.navigate(['/needs']);
  }
}

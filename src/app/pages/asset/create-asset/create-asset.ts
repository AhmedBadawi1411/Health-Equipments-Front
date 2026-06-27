import { Component, OnInit, signal, computed } from '@angular/core';
import { TextBoxWithLabel } from '../../../components/text-box-with-label/text-box-with-label';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Select } from 'primeng/select';
import { Button, ButtonModule } from 'primeng/button';
import { SectionHeader } from '../../../components/section-header/section-header';
import { ActivatedRoute, Router } from '@angular/router';
import { AssetForm, IAsset } from '../../../interfaces/Assets.interface';
import { TableModule } from 'primeng/table';
import { FacilitiesSerive } from '../../../services/facilities';
import { DepartmentsSerive } from '../../../services/department.service';
import { AssetsService } from '../../../services/assets';
import { InventoryService } from '../../../services/inventory.service';
import { AssetsHelperService } from '../../../services/assets-helpers';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { forkJoin, switchMap, of, map } from 'rxjs';

@Component({
  selector: 'app-create-asset',
  imports: [
    ButtonModule,
    Select,
    CommonModule,
    FormsModule,
    InputTextModule,
    DatePicker,
    IconField,
    InputIcon,
    SectionHeader,
    TableModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './create-asset.html',
  styleUrl: './create-asset.css',
})
export class CreateAsset implements OnInit {
  isSaving = false;
  isEditMode = false;
  assetId: number | null = null;

  assetsToSave = signal<AssetForm[]>([]);
  currentAsset: AssetForm = this.createEmptyAsset();

  equipmentStatus = [
    { name: 'نشط', value: 2 },
    { name: 'غير نشط', value: 3 },
    { name: 'قيد الصيانة', value: 4 },
    { name: 'خارج الخدمة مؤقتا', value: 5 },
    { name: 'خارج الخدمة نهائيا', value: 6 },
  ];

  equipmentStatusMap = new Map<number, string>();
  editingIndex: number | null = null;

  contractOptions = computed(() => {
    return this.assetsHelper.contracts().map((c) => ({
      name: `عقد #${c.contractNumber} - ${this.assetsHelper.suppliersMap().get(c.supplierId) || 'مورد مجهول'}`,
      value: c.contractId,
    }));
  });

  supplierOptions = computed(() => {
    return this.assetsHelper.suppliers().map((s) => ({
      name: s.supplierName,
      value: s.supplierId,
    }));
  });

  constructor(
    protected readonly assetsService: AssetsService,
    protected readonly facilitiesService: FacilitiesSerive,
    protected readonly inventoryService: InventoryService,
    protected readonly assetsHelper: AssetsHelperService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly departmentService: DepartmentsSerive,
    private readonly toast: MessageService,
  ) {}

  ngOnInit(): void {
    this.equipmentStatusMap = new Map<number, string>([
      [2, 'نشط'],
      [3, 'غير نشط'],
      [4, 'قيد الصيانة'],
      [5, 'خارج الخدمة مؤقتا'],
      [6, 'خارج الخدمة نهائيا'],
    ]);
    this.facilitiesService.loadFacilities();
    this.assetsService.loadAssetMaster();
    this.assetsHelper.loadContracts();
    this.assetsHelper.loadSuppliers();

    // Check if we are in Edit Mode
    const idParam = this.route.snapshot.params['id'];
    if (idParam) {
      this.isEditMode = true;
      this.assetId = Number(idParam);

      this.assetsService.getAsset(this.assetId).subscribe({
        next: (res) => {
          const asset = res.data;
          this.currentAsset = {
            facilityID: asset.facilityId,
            departmentID: asset.departmentId,
            assetType: asset.equipmentTypeId,
            assetStatus: asset.statusId,
            assetSerial: asset.serialNumber,
            purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : undefined,
            installationDate: asset.installationDate ? new Date(asset.installationDate) : undefined,
            supplierId: asset.supplierId || undefined,
          };
          this.onFacilitySelected(asset.facilityId);
        },
        error: (err) => {
          console.error('Failed to load asset details:', err);
          this.toast.add({
            severity: 'error',
            summary: 'خطأ في التحميل',
            detail: 'فشل تحميل بيانات الأصل الطبي المطلوب.',
          });
        },
      });
      return;
    }

    // Read query parameters for auto-population from inventory survey process
    const qParams = this.route.snapshot.queryParams;

    // Support single item registration
    if (qParams['facilityId'] && !qParams['surveyId']) {
      const facilityID = Number(qParams['facilityId']);
      const departmentID = Number(qParams['departmentId']);

      let assetType: number | undefined = undefined;
      if (
        qParams['assetType'] &&
        qParams['assetType'] !== 'null' &&
        qParams['assetType'] !== 'undefined'
      ) {
        const parsedType = Number(qParams['assetType']);
        if (!isNaN(parsedType) && parsedType !== 0) {
          assetType = parsedType;
        }
      }

      const assetSerial = qParams['serial'];
      const surveyItemId = qParams['surveyItemId'] ? Number(qParams['surveyItemId']) : undefined;

      this.currentAsset = {
        facilityID,
        departmentID,
        assetType,
        assetStatus: 2, // Default: Active
        assetSerial: assetSerial || '',
        installationDate: new Date(),
        purchaseDate: new Date(),
      };

      // Store the surveyItemId so we can resolve it on save
      (this.currentAsset as any).surveyItemId = surveyItemId;

      // Load departments for this facility
      this.onFacilitySelected(facilityID);
    }

    // Support batch survey items registration
    const surveyId = qParams['surveyId'] ? Number(qParams['surveyId']) : undefined;
    if (surveyId) {
      this.inventoryService.getSurveyById(surveyId).subscribe({
        next: (res) => {
          const survey = res.data;
          const facilityId = survey.facilityID || (survey as any).facilityId;

          // Filter items that need registration
          const unregisteredItems = (survey.items || []).filter((item) => item.needRegistration);

          if (unregisteredItems.length === 0) {
            this.toast.add({
              severity: 'info',
              summary: 'تنبيه',
              detail: 'لا توجد أجهزة غير مسجلة في عملية الحصر هذه.',
            });
            return;
          }

          // Automatically load departments for the facility
          if (facilityId) {
            this.facilitiesService.loadDepartments(facilityId);
          }

          const mappedAssets = unregisteredItems.map((item) => {
            const deptId = item.departmentID || (item as any).departmentId;
            let assetId = item.assetID !== undefined ? item.assetID : (item as any).assetId;
            if (
              assetId === null ||
              assetId === undefined ||
              isNaN(Number(assetId)) ||
              Number(assetId) === 0
            ) {
              assetId = undefined;
            } else {
              assetId = Number(assetId);
            }
            const serial = item.serialNumberSnapshot;
            const surveyItemId = item.surveyItemID || (item as any).surveyItemId;

            return {
              facilityID: facilityId,
              departmentID: deptId,
              assetId: assetId,
              assetType: item.equipmentMasterID,
              assetStatus: '2', // Active
              assetSerial: serial || '',
              installationDate: new Date(),
              purchaseDate: new Date(),
              surveyItemId: surveyItemId,
            } as any;
          });

          this.assetsToSave.set(mappedAssets);

          this.toast.add({
            severity: 'success',
            summary: 'تم تحميل البيانات بنجاح',
            detail: `تم تحميل عدد ${mappedAssets.length} أجهزة غير مسجلة من عملية الحصر.`,
          });
        },
        error: (err) => {
          console.error('Failed to load survey details for batch registration:', err);
          this.toast.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل تحميل بيانات عملية الحصر.',
          });
        },
      });
    }
  }

  onAddNewEquipmentMaster() {
    this.router.navigate(['..', 'equipments'], { relativeTo: this.route });
  }

  onFacilitySelected(facilityId: number) {
    if (facilityId) {
      this.facilitiesService.loadDepartments(facilityId);
    }
  }

  private createEmptyAsset(): AssetForm {
    return {
      facilityID: undefined,
      departmentID: undefined,
      assetType: undefined,
      assetStatus: undefined,
      assetSerial: undefined,
      installationDate: undefined,
      purchaseDate: undefined,
      supplierId: undefined,
    };
  }

  goBack() {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  addAsset() {
    if (
      !this.currentAsset.facilityID ||
      !this.currentAsset.departmentID ||
      !this.currentAsset.assetType ||
      !this.currentAsset.assetStatus ||
      !this.currentAsset.assetSerial?.trim()
    ) {
      this.toast.add({
        severity: 'error',
        summary: 'خطأ في التحقق',
        detail: 'يرجى ملء كافة الحقول الإلزامية: الجهة، القسم، نوع الجهاز، حالته ورقم تسلسله.',
      });
      return;
    }

    if (this.editingIndex === null) {
      const currentSerial = this.currentAsset.assetSerial?.trim().toLowerCase();
      const serialExists = this.assetsToSave().some(
        (asset, index) =>
          index !== this.editingIndex && asset.assetSerial?.trim().toLowerCase() === currentSerial,
      );

      if (serialExists) {
        this.toast.add({
          severity: 'error',
          summary: 'رقم تسلسل مكرر',
          detail: 'الأصل الذي تحاول إضافته يحتوي على رقم تسلسل موجود بالفعل في القائمة.',
        });
        return;
      }
    }

    if (this.editingIndex !== null) {
      const assets = [...this.assetsToSave()];
      assets[this.editingIndex] = { ...this.currentAsset };
      this.assetsToSave.set(assets);
      this.editingIndex = null;
    } else {
      this.assetsToSave.set([...this.assetsToSave(), { ...this.currentAsset }]);
    }

    // Keep facility and department to ease multiple entries
    const savedFacility = this.currentAsset.facilityID;
    const savedDept = this.currentAsset.departmentID;

    this.currentAsset = this.createEmptyAsset();
    this.currentAsset.facilityID = savedFacility;
    this.currentAsset.departmentID = savedDept;
  }

  deleteItem(index: number) {
    this.assetsToSave.set(this.assetsToSave().filter((_, i) => i !== index));
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.currentAsset = this.createEmptyAsset();
    }
  }

  editItem(index: number) {
    this.editingIndex = index;
    const item = this.assetsToSave()[index];
    if (item) {
      this.currentAsset = { ...item };
    }
  }

  saveAllAssets() {
    const assets = this.assetsToSave();
    if (assets.length === 0) {
      this.toast.add({
        severity: 'warn',
        summary: 'قائمة فارغة',
        detail: 'يرجى إضافة أصل واحد على الأقل إلى الجدول قبل الحفظ.',
      });
      return;
    }

    this.isSaving = true;

    const requests = assets.map((a) => {
      console.log(a);

      const payload = {
        equipmentTypeId: a.assetType,
        serialNumber: a.assetSerial!,
        purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString() : undefined,
        installationDate: a.installationDate
          ? new Date(a.installationDate).toISOString()
          : undefined,
        departmentId: Number(a.departmentID),
        facilityId: Number(a.facilityID),
        statusId: Number(a.assetStatus),
        supplierId: a.supplierId ? Number(a.supplierId) : undefined,
      };

      console.log(payload);

      const surveyItemId = (a as any).surveyItemId;
      const obs = surveyItemId
        ? this.assetsService.resolveSurveyToAsset({
            ...payload,
            surveyItemId: Number(surveyItemId),
          })
        : this.assetsService.createAsset(payload);

      if (a.contractID) {
        return obs.pipe(
          switchMap((res) => {
            if (res.success && res.data && res.data.assetId) {
              return this.assetsHelper
                .attachAssetToContract({
                  assetId: res.data.assetId,
                  contractId: Number(a.contractID),
                })
                .pipe(map(() => res));
            }
            return of(res);
          }),
        );
      }
      return obs;
    });

    forkJoin(requests).subscribe({
      next: (responses) => {
        this.toast.add({
          severity: 'success',
          summary: 'تم الحفظ بنجاح',
          detail: `تم إضافة عدد ${responses.length} أصل/أصول بنجاح.`,
        });
        this.assetsToSave.set([]);
        this.assetsService.loadAssets(true);
        setTimeout(() => {
          this.isSaving = false;
          // Go back to inventory details view if we came from there
          const queryParams = this.route.snapshot.queryParams;
          if (queryParams['facilityId']) {
            this.router.navigate(['/inventory']);
          } else {
            this.router.navigate(['..'], { relativeTo: this.route });
          }
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error saving assets:', err);
        this.toast.add({
          severity: 'error',
          summary: 'فشل الحفظ',
          detail: err.error?.message || 'حدث خطأ أثناء حفظ الأصول. يرجى المحاولة مرة أخرى.',
        });
      },
    });
  }

  updateSingleAsset() {
    if (
      !this.currentAsset.facilityID ||
      !this.currentAsset.departmentID ||
      !this.currentAsset.assetType ||
      !this.currentAsset.assetStatus ||
      !this.currentAsset.assetSerial?.trim()
    ) {
      this.toast.add({
        severity: 'error',
        summary: 'خطأ في التحقق',
        detail: 'يرجى ملء كافة الحقول الإلزامية: الجهة، القسم، نوع الجهاز، حالته ورقم تسلسله.',
      });
      return;
    }

    this.isSaving = true;
    const payload = {
      equipmentTypeId: this.currentAsset.assetType,
      serialNumber: this.currentAsset.assetSerial!,
      purchaseDate: this.currentAsset.purchaseDate
        ? new Date(this.currentAsset.purchaseDate).toISOString()
        : undefined,
      installationDate: this.currentAsset.installationDate
        ? new Date(this.currentAsset.installationDate).toISOString()
        : undefined,
      departmentId: Number(this.currentAsset.departmentID),
      facilityId: Number(this.currentAsset.facilityID),
      statusId: Number(this.currentAsset.assetStatus),
      supplierId: this.currentAsset.supplierId ? Number(this.currentAsset.supplierId) : undefined,
    };

    const updateObs = this.assetsService.updateAsset(this.assetId!, payload);

    const finalObs = this.currentAsset.contractID
      ? updateObs.pipe(
          switchMap((res) => {
            return this.assetsHelper
              .attachAssetToContract({
                assetId: this.assetId!,
                contractId: Number(this.currentAsset.contractID),
              })
              .pipe(map(() => res));
          }),
        )
      : updateObs;

    finalObs.subscribe({
      next: () => {
        this.toast.add({
          severity: 'success',
          summary: 'تم التحديث بنجاح',
          detail: 'تم تحديث بيانات الأصل الطبي بنجاح.',
        });
        setTimeout(() => {
          this.isSaving = false;
          this.router.navigate(['/assets']);
        }, 1500);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error updating asset:', err);
        this.toast.add({
          severity: 'error',
          summary: 'فشل التحديث',
          detail: err.error?.message || 'حدث خطأ أثناء تحديث بيانات الأصل. يرجى المحاولة مرة أخرى.',
        });
      },
    });
  }
}

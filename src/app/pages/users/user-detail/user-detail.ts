import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import { TableModule } from 'primeng/table';
import { MultiSelect } from 'primeng/multiselect';

import { UsersService } from '../../../services/users.service';
import { FacilitiesSerive } from '../../../services/facilities';
import { IUser, IUserForm, IPermission } from '../../../interfaces/User.interface';
import { SectionHeader } from '../../../components/section-header/section-header';
import { ModuleNamePipe } from "../../../pipes/module-name-pipe";
import { AuthService } from '../../../services/auth-service';

type OperationKey = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'OTHER';

/** الشكل اللي الـ p-table بتاخده — كل row عبارة عن object جاهز */
interface ModuleRow {
  module:      string;
  moduleLabel: string;
  VIEW:        IPermission[];
  CREATE:      IPermission[];
  EDIT:        IPermission[];
  DELETE:      IPermission[];
  OTHER:       IPermission[];
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,   // ← مهم: يوقف الـ re-render التلقائي
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
    ModuleNamePipe,
    TableModule,
    MultiSelect,
  ],
  providers: [MessageService],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.css'],
})
export class UserDetail implements OnInit {

  userId!: string;
  user = signal<IUser | null>(null);

  profileForm: IUserForm = { name: '', email: '' };

  selectedRoleId         = '';
  selectedPermissionIds  = signal<string[]>([]);   // ← signal عشان computed يتتبعه
  selectedFacilityIds: number[] = [];

  isSavingProfile     = false;
  isSavingRole        = false;
  isSavingPermissions = false;
  isSavingFacilities  = false;

  operations: { key: OperationKey; label: string }[] = [
    { key: 'VIEW',   label: 'عرض'   },
    { key: 'CREATE', label: 'إنشاء' },
    { key: 'EDIT',   label: 'تعديل' },
    { key: 'DELETE', label: 'حذف'   },
  ];

  // ─── الـ table rows — بتتحسب مرة واحدة لما البيانات تتغير ────────────────
  moduleRows = computed<ModuleRow[]>(() => {
    const rows: ModuleRow[] = [];
    for (const [module, perms] of this.usersService.permissionsByModule()) {
      rows.push({
        module,
        moduleLabel: this._arabicName(module),
        VIEW:   perms.filter(p => this._op(p) === 'VIEW'),
        CREATE: perms.filter(p => this._op(p) === 'CREATE'),
        EDIT:   perms.filter(p => this._op(p) === 'EDIT'),
        DELETE: perms.filter(p => this._op(p) === 'DELETE'),
        OTHER:  perms.filter(p => this._op(p) === 'OTHER'),
      });
    }
    return rows;
  });

  // ─── حالة الـ checkboxes — computed من selectedPermissionIds ─────────────
  allSelected = computed(() => {
    const all = this.usersService.permissions().map(p => p.id);
    return all.length > 0 && all.every(id => this.selectedPermissionIds().includes(id));
  });

  /** Map: "module|OP" → boolean — بتتحسب لما selectedPermissionIds يتغير */
  operationChecked = computed(() => {
    const selected = new Set(this.selectedPermissionIds());
    const result = new Map<string, boolean>();
    for (const row of this.moduleRows()) {
      for (const op of this.operations) {
        const perms = row[op.key];
        result.set(
          `${row.module}|${op.key}`,
          perms.length > 0 && perms.every(p => selected.has(p.id))
        );
      }
    }
    return result;
  });

  /** Map: module → selected OTHER ids */
  selectedOtherIds = computed(() => {
    const selected = new Set(this.selectedPermissionIds());
    const result = new Map<string, string[]>();
    for (const row of this.moduleRows()) {
      result.set(
        row.module,
        row.OTHER.filter(p => selected.has(p.id)).map(p => p.id)
      );
    }
    return result;
  });
  // ─────────────────────────────────────────────────────────────────────────

  constructor(
    private   readonly route:             ActivatedRoute,
    protected readonly usersService:      UsersService,
    protected readonly facilitiesService: FacilitiesSerive,
    private   readonly router:            Router,
    private   readonly toast:             MessageService,
    public    readonly authService:       AuthService,
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.userId) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'معرف المستخدم غير صحيح' });
      this.goBack();
      return;
    }
    this.usersService.loadRoles();
    this.usersService.loadPermissions();
    this.facilitiesService.loadFacilities();
    this.loadUserData();
  }

  loadUserData(): void {
    this.usersService.getUser(this.userId).subscribe({
      next: (res) => {
        if (res.data) {
          this.user.set(res.data);
          this.profileForm          = { name: res.data.name, email: res.data.email };
          this.selectedRoleId       = res.data.roleId || '';
          this.selectedPermissionIds.set(res.data.permissions?.map((p: any) => p.id) ?? []);
          this.selectedFacilityIds  = res.data.facilities?.map((f: any) => f.id) ?? [];
        }
      },
      error: () => {
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل بيانات المستخدم' });
      },
    });
  }

  // ─── Save actions ─────────────────────────────────────────────────────────

  saveProfile(): void {
    if (!this.profileForm.name || !this.profileForm.email) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم والبريد حقول إلزامية' });
      return;
    }
    this.isSavingProfile = true;
    this.usersService.updateUser(this.userId, this.profileForm).subscribe({
      next: () => {
        this.isSavingProfile = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الملف الشخصي' });
        const cur = this.user();
        if (cur) this.user.set({ ...cur, name: this.profileForm.name!, email: this.profileForm.email! });
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل تحديث الملف الشخصي' });
      },
    });
  }

  saveRole(): void {
    this.isSavingRole = true;
    this.usersService.assignRole(this.userId, this.selectedRoleId).subscribe({
      next: () => {
        this.isSavingRole = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تغيير دور المستخدم بنجاح' });
        this.loadUserData();
      },
      error: (err) => {
        this.isSavingRole = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل تغيير دور المستخدم' });
      },
    });
  }

  savePermissions(): void {
    const role        = this.usersService.roles().find(r => r.id === this.selectedRoleId);
    const rolePerms   = new Set(role?.permissions ?? []);
    const customPerms = this.selectedPermissionIds().filter(id => !rolePerms.has(id));

    this.isSavingPermissions = true;
    this.usersService.assignPermissions(this.userId, customPerms).subscribe({
      next: () => {
        this.isSavingPermissions = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ صلاحيات المستخدم المخصصة بنجاح' });
      },
      error: (err) => {
        this.isSavingPermissions = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل حفظ الصلاحيات' });
      },
    });
  }

  saveFacilities(): void {
    this.isSavingFacilities = true;
    this.usersService.assignFacilities(this.userId, this.selectedFacilityIds).subscribe({
      next: () => {
        this.isSavingFacilities = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ الجهات الطبية المسندة للمستخدم بنجاح' });
      },
      error: (err) => {
        this.isSavingFacilities = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل حفظ الجهات الطبية المسندة' });
      },
    });
  }

  isAllFacilitiesSelected(): boolean {
    const all = this.facilitiesService.facilities();
    if (all.length === 0) return false;
    return all.every(f => this.selectedFacilityIds.includes(f.facilityID));
  }

  toggleSelectAllFacilities(checked: boolean): void {
    if (checked) {
      this.selectedFacilityIds = this.facilitiesService.facilities().map(f => f.facilityID);
    } else {
      this.selectedFacilityIds = [];
    }
  }

  goBack(): void { this.router.navigate(['/users']); }

  // ─── Event handlers من الـ template ──────────────────────────────────────

  toggleSelectAll(checked: boolean): void {
    this.selectedPermissionIds.set(
      checked ? this.usersService.permissions().map(p => p.id) : []
    );
  }

  toggleOperation(row: ModuleRow, op: OperationKey, checked: boolean): void {
    const ids = row[op].map(p => p.id);
    const cur = new Set(this.selectedPermissionIds());
    if (checked) ids.forEach(id => cur.add(id));
    else         ids.forEach(id => cur.delete(id));
    this.selectedPermissionIds.set([...cur]);
  }

  onRoleChange(newRoleId: string): void {
    const role = this.usersService.roles().find(r => r.id === newRoleId);
    this.selectedPermissionIds.set(role?.permissions ? [...role.permissions] : []);
  }

  onOtherPermissionsChange(row: ModuleRow, newIds: string[]): void {
    const otherSet = new Set(row.OTHER.map(p => p.id));
    const cur      = this.selectedPermissionIds().filter(id => !otherSet.has(id));
    this.selectedPermissionIds.set([...cur, ...newIds]);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private _op(perm: IPermission): OperationKey {
    const action = (perm.code || '').toLowerCase().split(':')[1] || '';
    if (action === 'read'   || action === 'view')                                         return 'VIEW';
    if (action === 'create' || action === 'approve' || action === 'start' || action === 'add') return 'CREATE';
    if (action === 'update' || action === 'edit')                                         return 'EDIT';
    if (action === 'delete' || action === 'remove')                                       return 'DELETE';
    return 'OTHER';
  }

  private _arabicName(module: string): string {
    const map: Record<string, string> = {
      user: 'المستخدمين', role: 'الأدوار', permission: 'الصلاحيات',
      facility: 'الجهات الطبية', inventory: 'المخزون', maintenance: 'الصيانة',
      equipment: 'الأجهزة الطبية', asset: 'الأصول', request: 'الطلبات',
      supplier: 'الموردين', gis: 'البيانات المكانية', region: 'البلديات',
      department: 'الأقسام', dashboard: 'لوحة التحكم',
    };
    return map[module.toLowerCase()] || module;
  }
}
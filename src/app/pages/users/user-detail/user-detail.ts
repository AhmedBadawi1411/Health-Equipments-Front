import { Component, OnInit, signal } from '@angular/core';
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

import { UsersService } from '../../../services/users.service';
import { FacilitiesSerive } from '../../../services/facilities';
import { IUser, IUserForm, IPermission } from '../../../interfaces/User.interface';
import { SectionHeader } from '../../../components/section-header/section-header';
import { ModuleNamePipe } from "../../../pipes/module-name-pipe";

@Component({
  selector: 'app-user-detail',
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
    ModuleNamePipe,
    TableModule
],
  providers: [MessageService],
  templateUrl: './user-detail.html',
  styleUrls: ['./user-detail.css'],
})
export class UserDetail implements OnInit {

  userId!: string;
  user = signal<IUser | null>(null);

  // Form states
  profileForm: IUserForm = {
    name: '',
    email: '',
  };

  selectedRoleId = '';
  selectedPermissionIds: string[] = [];
  selectedFacilityIds: number[] = [];

  isSavingProfile = false;
  isSavingRole = false;
  isSavingPermissions = false;
  isSavingFacilities = false;

  constructor(
    private   readonly route:             ActivatedRoute,
    protected readonly usersService:      UsersService,
    protected readonly facilitiesService: FacilitiesSerive,
    private   readonly router:            Router,
    private   readonly toast:             MessageService,
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    console.info('DEBUG: UserDetail ngOnInit, userId =', this.userId);
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
    console.info('DEBUG: loadUserData starting for userId =', this.userId);
    this.usersService.getUser(this.userId).subscribe({
      next: (res) => {
        console.info('DEBUG: getUser next callback, res =', res);
        if (res.data) {
          this.user.set(res.data);
          this.profileForm = {
            name: res.data.name,
            email: res.data.email,
          };
          this.selectedRoleId = res.data.roleId || '';
          this.selectedPermissionIds = res.data.permissions?.map(p => p.id) || [];
          this.selectedFacilityIds = res.data.facilities?.map(f => f.id) || [];
          console.info('DEBUG: Assigned user data, user =', this.user());
        } else {
          console.warn('DEBUG: res.data is falsy!');
        }
      },
      error: (err) => {
        console.error('DEBUG: getUser error callback, err =', err);
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل بيانات المستخدم' });
      }
    });
  }

  saveProfile(): void {
    if (!this.profileForm.name || !this.profileForm.email) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'الاسم والبريد حقول إلزامية' });
      return;
    }

    this.isSavingProfile = true;
    this.usersService.updateUser(this.userId, this.profileForm).subscribe({
      next: (res) => {
        this.isSavingProfile = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث الملف الشخصي' });
        const currentUser = this.user();
        if (currentUser) {
          this.user.set({
            ...currentUser,
            name: this.profileForm.name!,
            email: this.profileForm.email!
          });
        }
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل تحديث الملف الشخصي' });
      }
    });
  }

  saveRole(): void {
    this.isSavingRole = true;
    this.usersService.assignRole(this.userId, this.selectedRoleId).subscribe({
      next: (res) => {
        this.isSavingRole = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تغيير دور المستخدم بنجاح' });
        this.loadUserData(); // Reload to update UI / permission set for that role if backend defaults it
      },
      error: (err) => {
        this.isSavingRole = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل تغيير دور المستخدم' });
      }
    });
  }

  savePermissions(): void {
    this.isSavingPermissions = true;
    this.usersService.assignPermissions(this.userId, this.selectedPermissionIds).subscribe({
      next: () => {
        this.isSavingPermissions = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم حفظ صلاحيات المستخدم المخصصة بنجاح' });
      },
      error: (err) => {
        this.isSavingPermissions = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل حفظ الصلاحيات' });
      }
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
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  getModules(): string[] {
    return Array.from(this.usersService.permissionsByModule().keys());
  }

  getPermissionsForModule(module: string): IPermission[] {
    return this.usersService.permissionsByModule().get(module) || [];
  }

  operations = [
    { key: 'VIEW', label: 'عرض' },
    { key: 'CREATE', label: 'إضافة' },
    { key: 'EDIT', label: 'تعديل' },
    { key: 'DELETE', label: 'حذف' }
  ];

  getPermissionOperation(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('عرض')) return 'VIEW';
    if (n.includes('إضافة') || n.includes('بدء')) return 'CREATE';
    if (n.includes('تعديل')) return 'EDIT';
    if (n.includes('حذف')) return 'DELETE';
    return 'VIEW';
  }

  getPermissionForModuleAndOperation(module: string, operation: string): IPermission | undefined {
    const perms = this.getPermissionsForModule(module);
    return perms.find(p => this.getPermissionOperation(p.name) === operation);
  }
}

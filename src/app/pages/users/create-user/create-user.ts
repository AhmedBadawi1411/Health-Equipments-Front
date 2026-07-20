import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { UsersService } from '../../../services/users.service';
import { IUserForm } from '../../../interfaces/User.interface';
import { SectionHeader } from '../../../components/section-header/section-header';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    Select,
    IconField,
    InputIcon,
    ToastModule,
    SectionHeader,
  ],
  providers: [MessageService],
  templateUrl: './create-user.html',
  styleUrls: ['./create-user.css'],
})
export class CreateUser implements OnInit {

  userForm: IUserForm = {
    name: '',
    email: '',
    password: '',
    roleId: '',
  };

  isSubmitting = false;

  constructor(
    protected readonly usersService: UsersService,
    private   readonly router:       Router,
    private   readonly toast:        MessageService,
  ) {}

  ngOnInit(): void {
    this.usersService.loadRoles();
  }

  saveUser(): void {
    if (!this.userForm.name || !this.userForm.email || !this.userForm.password) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى ملء الحقول الإلزامية الاسم، البريد، وكلمة المرور' });
      return;
    }

    if (this.userForm.name.trim().length < 3) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يجب ألا يقل الاسم عن 3 أحرف' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userForm.email.trim())) {
      this.toast.add({ severity: 'warn', summary: 'تنبيه', detail: 'يرجى إدخال بريد إلكتروني صالح' });
      return;
    }

    const password = this.userForm.password;
    const hasSpecialChar = /[\W_]/.test(password);
    if (password.length < 8 || !hasSpecialChar) {
      this.toast.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يجب أن تتكون كلمة المرور من 8 رموز على الأقل وتحتوي على رمز خاص واحد على الأقل'
      });
      return;
    }

    this.isSubmitting = true;
    this.usersService.createUser(this.userForm).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toast.add({ severity: 'success', summary: 'تمت العملية بنجاح', detail: 'تم إنشاء المستخدم بنجاح' });
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toast.add({ severity: 'error', summary: 'خطأ', detail: err.error?.message || 'فشل إنشاء المستخدم الجديد' });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }
}

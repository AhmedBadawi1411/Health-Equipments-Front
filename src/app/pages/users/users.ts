import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { Tag } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { UsersService } from '../../services/users.service';
import { IUser } from '../../interfaces/User.interface';
import { SectionHeader } from '../../components/section-header/section-header';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconField,
    InputIcon,
    Tag,
    TableModule,
    ConfirmDialogModule,
    ToastModule,
    SectionHeader,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class Users implements OnInit {

  searchQuery = '';

  constructor(
    protected readonly usersService: UsersService,
    private   readonly router:       Router,
    private   readonly confirm:      ConfirmationService,
    private   readonly toast:        MessageService,
  ) {}

  ngOnInit(): void {
    this.usersService.loadUsers();
    this.usersService.loadRoles();
  }

  // ── Filtered ───────────────────────────────────────────────────
  get filtered(): IUser[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return this.usersService.users();
    return this.usersService.users().filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.role?.name ?? '').toLowerCase().includes(q)
    );
  }

  onSearchChange(): void {}

  // ── Navigation ─────────────────────────────────────────────────────────────
  goToCreate(): void {
    this.router.navigate(['/users/create']);
  }

  goToDetail(user: IUser): void {
    this.router.navigate(['/users', user.id]);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  confirmDelete(user: IUser): void {
    this.confirm.confirm({
      message: `هل أنت متأكد من حذف المستخدم "${user.name}"؟`,
      header:  'تأكيد الحذف',
      icon:    'pi pi-exclamation-triangle',
      accept: () => {
        this.usersService.deleteUser(user.id).subscribe({
          next: () => {
            this.usersService.loadUsers();
            this.toast.add({ severity: 'success', summary: 'تم الحذف', detail: `تم حذف المستخدم ${user.name}` });
          },
          error: () => this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حذف المستخدم' }),
        });
      },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  /** Returns initials (max 2 letters) from a full name */
  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  /** Deterministic color from name for avatar background */
  avatarColor(name: string): string {
    const colors = [
      '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6',
      '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
    ];
    let hash = 0;
    for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
    return colors[Math.abs(hash) % colors.length];
  }
}

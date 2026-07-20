import { Component, OnInit, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SideBar } from '../../components/side-bar/side-bar';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { BreadCrumpLabelMap } from '../../components/bread-crump/label-map';
import { BreadcrumbModule } from "primeng/breadcrumb";
import { RolePipe } from '../../pipes/role-pipe';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { UsersService } from '../../services/users.service';
import { HealthcareService } from '../../services/healthcare.service';

@Component({
  selector: 'app-app-layout',
  imports: [
    CommonModule,
    SideBar,
    RouterOutlet,
    BreadcrumbModule,
    RolePipe,
    DialogModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    FormsModule
  ],
  providers: [MessageService],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout implements OnInit {
  isUserDropdownOpen = false;
  isPasswordDialogOpen = false;
  isSavingPassword = false;
  passwordForm = { password: '', confirmPassword: '' };
  isSidebarMinimized = false;
  notifications: any[] = [];
  unreadNotificationsCount = 0;
  isNotificationsOpen = false;
 
  constructor(
    protected readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly toast: MessageService,
    private readonly router: Router,
    protected readonly healthcareService: HealthcareService,
  ) {}
 
  ngOnInit(): void {
    this.loadNotifications();
    setInterval(() => this.loadNotifications(), 30000);
  }

  // getCurrentPageName(): string {
  //   const url = this.router.url;
  //   if (url.includes('/home')) return 'لوحة التحكم';
  //   if (url.includes('/facilities/create')) return 'إضافة مرفق جديد';
  //   if (url.includes('/facilities/edit')) return 'تعديل منشأة صحية';
  //   if (url.includes('/facilities')) return 'المرافق الصحية';
  //   if (url.includes('/assets/create')) return 'إضافة أصل جديد';
  //   if (url.includes('/assets')) return 'إدارة الأصول الطبية';
  //   if (url.includes('/inventory')) return 'عمليات الحصر وال';
  //   if (url.includes('/needs/create') || url.includes('/needs/edit')) return 'طلب احتياج جديد';
  //   if (url.includes('/needs')) return 'طلبات الاحتياج';
  //   if (url.includes('/maintenance')) return 'إدارة الصيانة';
  //   if (url.includes('/users/create')) return 'إضافة مستخدم جديد';
  //   if (url.includes('/users/')) return 'تفاصيل المستخدم';
  //   if (url.includes('/users')) return 'إدارة المستخدمين';
  //   if (url.includes('/reports')) return 'التقارير والإحصائيات';
  //   return 'الرئيسية';
  // }

  protected breadCrump: { label: string; routerLink: string }[] = [];
  itemsMap = BreadCrumpLabelMap;

  buildBreadcrumb() {
    const url = this.router.url;

    const segments = url.split('/').filter(Boolean);

    this.breadCrump = segments.map((segment, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/');
      console.log(path);
      return {
        label: this.itemsMap[path] || segment,
        routerLink: '/' + arr.slice(0, index + 1).join('/'),
      };
    });
  }

  getFormattedDate(): string {
    return new Date().toLocaleDateString('ar-LY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }

  toggleUserDropdown(event: Event) {
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.isUserDropdownOpen = false;
    this.isNotificationsOpen = false;
  }

  loadNotifications() {
    if (!this.authService.user()) return;
    this.healthcareService.getNotifications().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.notifications = res.data;
          this.unreadNotificationsCount = res.data.filter((n: any) => !n.read).length;
        }
      }
    });
  }

  toggleNotifications(event: Event) {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isUserDropdownOpen = false;
  }

  markRead(notification: any) {
    if (notification.read) return;
    this.healthcareService.markNotificationRead(notification.id).subscribe({
      next: (res: any) => {
        if (res.success) {
          notification.read = true;
          this.unreadNotificationsCount = Math.max(0, this.unreadNotificationsCount - 1);
        }
      }
    });
  }

  onNotificationClick(notification: any) {
    this.markRead(notification);
    this.isNotificationsOpen = false;

    if (notification.targetType && notification.targetId) {
      const id = Number(notification.targetId);
      if (notification.targetType === 'NEED_REQUEST_EQUIPMENT') {
        this.healthcareService.activeNeedTab.set('equipment');
        this.healthcareService.selectedNeedRequestId.set(id);
        this.router.navigate(['/needs']);
      } else if (notification.targetType === 'NEED_REQUEST_CONSUMABLE') {
        this.healthcareService.activeNeedTab.set('consumables');
        this.healthcareService.selectedNeedRequestId.set(id);
        this.router.navigate(['/needs']);
      }
    }
  }

  markAllRead() {
    const unread = this.notifications.filter(n => !n.read);
    for (const n of unread) {
      this.markRead(n);
    }
  }

  formatNotificationTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} د`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} س`;
    
    return date.toLocaleDateString('ar-LY', { month: 'short', day: 'numeric' });
  }

  openChangePasswordDialog() {
    this.passwordForm = { password: '', confirmPassword: '' };
    this.isPasswordDialogOpen = true;
    this.isUserDropdownOpen = false;
  }

  submitPasswordChange() {
    const password = this.passwordForm.password;
    const confirmPassword = this.passwordForm.confirmPassword;
    const currentUser = this.authService.user();

    if (!currentUser) return;

    if (!password || !confirmPassword) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'يرجى ملء جميع حقول كلمة المرور' });
      return;
    }

    if (password !== confirmPassword) {
      this.toast.add({ severity: 'error', summary: 'خطأ', detail: 'كلمتا المرور غير متطابقتين' });
      return;
    }

    const hasSpecialChar = /[\W_]/.test(password);
    if (password.length < 8 || !hasSpecialChar) {
      this.toast.add({
        severity: 'warn',
        summary: 'تنبيه',
        detail: 'يجب أن تتكون كلمة المرور من 8 رموز على الأقل وتحتوي على رمز خاص واحد على الأقل'
      });
      return;
    }

    this.isSavingPassword = true;
    this.usersService.updateUser(currentUser.id, { password } as any).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.isPasswordDialogOpen = false;
        this.toast.add({ severity: 'success', summary: 'نجاح', detail: 'تم تحديث كلمة المرور بنجاح' });
      },
      error: (err) => {
        this.isSavingPassword = false;
        this.toast.add({
          severity: 'error',
          summary: 'خطأ',
          detail: err.error?.message || 'فشل تحديث كلمة المرور',
        });
      },
    });
  }
}

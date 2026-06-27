import { Component, OnInit } from '@angular/core';
import { SideBar } from '../../components/side-bar/side-bar';
import { Router, RouterOutlet } from '@angular/router';
import { FacilitiesSerive } from '../../services/facilities';
import { DepartmentsSerive } from '../../services/department.service';
import { AssetsService } from '../../services/assets';
import { AuthService } from '../../services/auth-service';
import { BreadCrumpLabelMap } from '../../components/bread-crump/label-map';
import { BreadcrumbModule } from "primeng/breadcrumb";
import { BreadCrump } from "../../components/bread-crump/bread-crump";

@Component({
  selector: 'app-app-layout',
  imports: [SideBar, RouterOutlet, BreadcrumbModule, BreadCrump],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout implements OnInit {
  constructor(
    private readonly facilitiesSerivce: FacilitiesSerive,
    private readonly departmentService: DepartmentsSerive,
    private readonly assetMaster: AssetsService,
    protected readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.facilitiesSerivce.loadFacilities();
    this.facilitiesSerivce.loadRegions();
    console.log("==============================");
    
    this.departmentService.loadDepartments();
    console.log("==============================");

    // this.facilitiesSerivce.loadDepartments();
    this.assetMaster.loadAssetMaster();
  }

  // getCurrentPageName(): string {
  //   const url = this.router.url;
  //   if (url.includes('/home')) return 'لوحة التحكم';
  //   if (url.includes('/facilities/create')) return 'إضافة منشأة جديدة';
  //   if (url.includes('/facilities/edit')) return 'تعديل منشأة صحية';
  //   if (url.includes('/facilities')) return 'الجهات الصحية';
  //   if (url.includes('/assets/create')) return 'إضافة أصل جديد';
  //   if (url.includes('/assets')) return 'إدارة الأصول الطبية';
  //   if (url.includes('/inventory')) return 'عمليات الحصر والجرد';
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
}

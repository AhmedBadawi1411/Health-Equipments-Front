import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { AppLayout } from './layouts/app-layout/app-layout';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '',
    loadComponent: () => AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((m) => m.Login),
      },
    ],
  },
  // {
  //   path: '',
  //   loadComponent: () => AppLayout,
  //   canActivate: [authGuard],
  //   children: [
  //     {
  //       path: 'home',
  //       loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  //     },
  //     {
  //       path: 'map',
  //       loadComponent: () =>
  //         import('./pages/spatial-analysis/spatial-analysis').then((m) => m.SpatialAnalysis),
  //       canActivate: [permissionGuard('gis:analysis')],
  //     },
  //     {
  //       path: 'facilities',
  //       loadComponent: () => FacilitiesLayout,
  //       canActivate: [permissionGuard('facility:read')],
  //       children: [
  //         { path: '', component: Facilities },
  //         { path: 'create', component: CreateFacility },
  //         {
  //           path: 'edit/:id',
  //           loadComponent: () => import('./pages/facilities/facility-detail/facility-detail').then((m) => m.FacilityDetail),
  //         },
  //       ],
  //     },
  //     {
  //       path: 'inventory',
  //       loadComponent: () => import('./pages/inventory/inventory').then((m) => m.InventoryComponent),
  //       canActivate: [permissionGuard('inventory:read')],
  //     },
  //     {
  //       path: 'simple-system',
  //       loadComponent: () => import('./pages/simple-system/simple-system-layout').then((m) => m.SimpleSystemLayoutComponent),
  //       canActivate: [authGuard],
  //       children: [
  //         { path: '', redirectTo: 'facilities', pathMatch: 'full' },
  //         {
  //           path: 'facilities',
  //           loadComponent: () => import('./pages/simple-system/facilities/facilities').then((m) => m.FacilitiesComponent),
  //         },
  //         {
  //           path: 'inventory',
  //           loadComponent: () => import('./pages/simple-system/inventory/inventory').then((m) => m.InventoryComponent),
  //         },
  //         {
  //           path: 'equipment-needs',
  //           redirectTo: 'needs',
  //           pathMatch: 'full'
  //         },
  //         {
  //           path: 'consumables-needs',
  //           redirectTo: 'needs',
  //           pathMatch: 'full'
  //         },
  //         {
  //           path: 'needs',
  //           loadComponent: () => import('./pages/simple-system/needs/needs-wrapper/needs-wrapper').then((m) => m.NeedsWrapperComponent),
  //         },
  //         {
  //           path: 'maintenance',
  //           loadComponent: () => import('./pages/simple-system/maintenance/maintenance').then((m) => m.MaintenanceComponent),
  //         },
  //         {
  //           path: 'approvals',
  //           loadComponent: () => import('./pages/simple-system/approvals/approvals').then((m) => m.ApprovalsComponent),
  //         },
  //         {
  //           path: 'users',
  //           loadComponent: () => import('./pages/simple-system/users/users').then((m) => m.UsersComponent),
  //         },
  //       ]
  //     },
  //     {
  //       path: 'maintenance',
  //       loadComponent: () => import('./pages/maintenance/maintenance').then((m) => m.Maintenance),
  //       canActivate: [permissionGuard('maintenance:read')],
  //     },
  //     {
  //       path: 'users',
  //       loadComponent: () => import('./layouts/pages/users-layout/users-layout').then((m) => m.UsersLayout),
  //       canActivate: [permissionGuard('user:read')],
  //       children: [
  //         {
  //           path: '',
  //           loadComponent: () => import('./pages/users/users').then((m) => m.Users),
  //         },
  //         {
  //           path: 'create',
  //           loadComponent: () => import('./pages/users/create-user/create-user').then((m) => m.CreateUser),
  //         },
  //         {
  //           path: ':id',
  //           loadComponent: () => import('./pages/users/user-detail/user-detail').then((m) => m.UserDetail),
  //         },
  //       ]
  //     },
  //     {
  //       path: 'reports',
  //       loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
  //       canActivate: [permissionGuard('dashboard:read')],
  //     },
  //     {
  //       path: 'assets',
  //       loadComponent: () => AssetsLayout,
  //       canActivate: [permissionGuard('asset:read')],
  //       children: [
  //         { path: '', component: Assets },
  //         { path: 'create', component: CreateAsset },
  //         { path: 'edit/:id', component: CreateAsset },
  //         { path: 'categories', component: AssetsCategories },
  //         { path: 'manufacturers', component: AssetsManufacturers },
  //         { path: 'equipments', component: EquipmentMaster },
  //         { path: 'suppliers', component: AssetsSuppliers },
  //         { path: 'contracts', component: AssetsContracts },
  //       ],
  //     },
  //     {
  //       path: 'needs',
  //       loadComponent: () => NeedsLayout,
  //       canActivate: [permissionGuard('request:read')],
  //       children: [
  //         { path: '', component: NeedRequests },
  //         { path: 'create', component: CreateNeed },
  //         { path: 'edit/:id', component: CreateNeed },
  //       ],
  //     },
  //   ],
  // },
  {
    path: '',
    loadComponent: () => AppLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'map',
        loadComponent: () =>
          import('./pages/spatial-analysis/spatial-analysis').then((m) => m.SpatialAnalysis),
        canActivate: [permissionGuard('gis:analysis')],
      },

      {
        path: 'facilities',
        loadComponent: () =>
          import('./pages/facilities/facilities').then(
            (m) => m.FacilitiesComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/inventory/inventory').then((m) => m.InventoryComponent),
      },
      {
        path: 'equipment-needs',
        redirectTo: 'needs',
        pathMatch: 'full',
      },
      {
        path: 'consumables-needs',
        redirectTo: 'needs',
        pathMatch: 'full',
      },
      {
        path: 'needs',
        loadComponent: () =>
          import('./pages/needs/needs-wrapper/needs-wrapper').then(
            (m) => m.NeedsWrapperComponent,
          ),
      },
      {
        path: 'maintenance',
        loadComponent: () =>
          import('./pages/maintenance/maintenance').then(
            (m) => m.MaintenanceComponent,
          ),
      },
      {
        path: 'approvals',
        loadComponent: () =>
          import('./pages/approvals/approvals').then((m) => m.ApprovalsComponent),
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/users/users').then((m) => m.Users),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./pages/users/create-user/create-user').then((m) => m.CreateUser),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/users/user-detail/user-detail').then((m) => m.UserDetail),
          },
        ],
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./pages/audit-logs/audit-logs').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./pages/import/import').then((m) => m.ImportComponent),
      },

    ],
  },
  { path: '**', redirectTo: 'home' },
];

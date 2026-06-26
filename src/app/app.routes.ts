import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { AppLayout } from './layouts/app-layout/app-layout';
import { CreateAsset } from './pages/asset/create-asset/create-asset';
import { AssetsCategories } from './pages/asset/assets-categories/assets-categories';
import { AssetsManufacturers } from './pages/asset/assets-manufacturers/assets-manufacturers';
import { Assets } from './pages/asset/assets/assets';
import { AssetsLayout } from './layouts/pages/assets-layout/assets-layout';
import { EquipmentMaster } from './pages/equipments/equipment-master/equipment-master';
import { Facilities } from './pages/facilities/facilities';
import { FacilitiesLayout } from './layouts/pages/facilities-layout/facilities-layout';
import { CreateFacility } from './pages/facilities/create-facility/create-facility';
import { NeedsLayout } from './layouts/pages/needs-layout/needs-layout';
import { NeedRequests } from './pages/need-requests/need-requests';
import { CreateNeed } from './pages/need-requests/create-need/create-need';
import { AssetsSuppliers } from './pages/asset/assets-suppliers/assets-suppliers';
import { AssetsContracts } from './pages/asset/assets-contracts/assets-contracts';

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
      },
      {
        path: 'facilities',
        loadComponent: () => FacilitiesLayout,
        children: [
          { path: '', component: Facilities },
          { path: 'create', component: CreateFacility },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/facilities/facility-detail/facility-detail').then((m) => m.FacilityDetail),
          },
        ],
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/inventory/inventory').then((m) => m.InventoryComponent),
      },
      {
        path: 'maintenance',
        loadComponent: () => import('./pages/maintenance/maintenance').then((m) => m.Maintenance),
      },
      {
        path: 'users',
        loadComponent: () => import('./layouts/pages/users-layout/users-layout').then((m) => m.UsersLayout),
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/users/users').then((m) => m.Users),
          },
          {
            path: 'create',
            loadComponent: () => import('./pages/users/create-user/create-user').then((m) => m.CreateUser),
          },
          {
            path: ':id',
            loadComponent: () => import('./pages/users/user-detail/user-detail').then((m) => m.UserDetail),
          },
        ]
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'assets',
        loadComponent: () => AssetsLayout,
        children: [
          { path: '', component: Assets },
          { path: 'create', component: CreateAsset },
          { path: 'edit/:id', component: CreateAsset },
          { path: 'categories', component: AssetsCategories },
          { path: 'manufacturers', component: AssetsManufacturers },
          { path: 'equipments', component: EquipmentMaster },
          { path: 'suppliers', component: AssetsSuppliers },
          { path: 'contracts', component: AssetsContracts },
        ],
      },
      {
        path: 'needs',
        loadComponent: () => NeedsLayout,
        children: [
          { path: '', component: NeedRequests },
          { path: 'create', component: CreateNeed },
          { path: 'edit/:id', component: CreateNeed },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];

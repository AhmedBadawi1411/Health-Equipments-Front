import { computed, Injectable, signal } from '@angular/core';
import { HttpClientWrapper } from './http-client-wrapper';
import { AppEnvironment, EndPoints } from '../environment';
import { Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/Response.interface';

export interface IManufacturer {
  manufacturerId: number;
  manufacturerName: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICategory {
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ISupplier {
  supplierId: number;
  supplierName: string;
  contactPerson?: string;
  mobile?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IContract {
  contractId: number;
  supplierId: number;
  contractNumber: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AssetsHelperService {
  private manufacturersSignal = signal<IManufacturer[]>([]);
  private categoriesSignal = signal<ICategory[]>([]);
  private suppliersSignal = signal<ISupplier[]>([]);
  private contractsSignal = signal<IContract[]>([]);

  manufacturers = this.manufacturersSignal.asReadonly();
  categories = this.categoriesSignal.asReadonly();
  suppliers = this.suppliersSignal.asReadonly();
  contracts = this.contractsSignal.asReadonly();

  manufacturersMap = computed(() => {
    const map = new Map<number, string>();
    this.manufacturersSignal().forEach((m) => map.set(m.manufacturerId, m.manufacturerName));
    return map;
  });

  categoriesMap = computed(() => {
    const map = new Map<number, string>();
    this.categoriesSignal().forEach((c) => map.set(c.categoryId, c.categoryName));
    return map;
  });

  suppliersMap = computed(() => {
    const map = new Map<number, string>();
    this.suppliersSignal().forEach((s) => map.set(s.supplierId, s.supplierName));
    return map;
  });

  contractsMap = computed(() => {
    const map = new Map<number, string>();
    this.contractsSignal().forEach((c) => map.set(c.contractId, c.contractNumber));
    return map;
  });

  constructor(private readonly httpClient: HttpClientWrapper) {}

  private buildUrl(baseUrl: string, endPoint: string) {
    return baseUrl + endPoint;
  }

  // Manufacturers
  loadManufacturers(force = false) {
    if (this.manufacturersSignal().length > 0 && !force) return;
    this.httpClient
      .get<ApiResponse<IManufacturer[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.MANUFACTURERS.GET))
      .subscribe((res) => {
        this.manufacturersSignal.set(res.data || []);
      });
  }

  createManufacturer(payload: { manufacturerName: string; country?: string }): Observable<ApiResponse<IManufacturer>> {
    return this.httpClient.post<ApiResponse<IManufacturer>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.MANUFACTURERS.CREATE),
      payload
    );
  }

  // Categories
  loadCategories(force = false) {
    if (this.categoriesSignal().length > 0 && !force) return;
    this.httpClient
      .get<ApiResponse<ICategory[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.CATEGORIES.GET))
      .subscribe((res) => {
        this.categoriesSignal.set(res.data || []);
      });
  }

  createCategory(payload: { categoryName: string }): Observable<ApiResponse<ICategory>> {
    return this.httpClient.post<ApiResponse<ICategory>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.CATEGORIES.CREATE),
      payload
    );
  }

  // Suppliers
  loadSuppliers(force = false) {
    if (this.suppliersSignal().length > 0 && !force) return;
    this.httpClient
      .get<ApiResponse<ISupplier[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.SUPPLIERS.GET))
      .subscribe((res) => {
        this.suppliersSignal.set(res.data || []);
      });
  }

  createSupplier(payload: {
    supplierName: string;
    contactPerson?: string;
    mobile?: string;
    email?: string;
  }): Observable<ApiResponse<ISupplier>> {
    return this.httpClient.post<ApiResponse<ISupplier>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.SUPPLIERS.CREATE),
      payload
    );
  }

  // Contracts
  loadContracts(force = false) {
    if (this.contractsSignal().length > 0 && !force) return;
    this.httpClient
      .get<ApiResponse<IContract[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.CONTRACTS.GET))
      .subscribe((res) => {
        this.contractsSignal.set(res.data || []);
      });
  }

  createContract(payload: {
    supplierId: number;
    contractNumber: string;
    startDate: string;
    endDate: string;
  }): Observable<ApiResponse<IContract>> {
    return this.httpClient.post<ApiResponse<IContract>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.CONTRACTS.CREATE),
      payload
    );
  }

  // Attach Asset to Contract
  attachAssetToContract(payload: { assetId: number; contractId: number }): Observable<ApiResponse<any>> {
    return this.httpClient.post<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.EQUIPMENT_CONTRACTS.CREATE),
      payload
    );
  }
}

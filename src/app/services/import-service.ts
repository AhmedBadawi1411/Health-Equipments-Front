import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppEnvironment, EndPoints } from '../environment';
import { ApiResponse } from '../interfaces/Response.interface';

export interface ImportValidationReport {
  summary: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    duplicates: number;
    nulls: number;
    warnings: number;
  };
  departments: ImportDepartmentInfo[];
  rows: ImportRowResult[];
}

export interface ImportDepartmentInfo {
  excelDepartmentName: string;
  exists: boolean;
  matchedDepartmentId: number | null;
}

export interface ImportRowResult {
  rowIndex: number;
  excelDepartmentName: string;
  scientificName: string;
  itemType: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  countryOfOrigin: string;
  manufacturingDate: string | null;
  supplierCompany: string;
  installationDate: string;
  operationalStatus: string;
  unit: string;
  quantity: number;
  minimumStock: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DepartmentMapping {
  excelDepartmentName: string;
  mappedDepartmentId: number | null;
  createNew: boolean;
}

export interface ImportRequest {
  id: number;
  facilityId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedBy: string;
  requestDate: string;
  reviewerNotes?: string;
  createdAt: string;
  updatedAt: string;
  facility?: { facilityName: string };
  mappings?: DepartmentMapping[];
  items?: ImportRowResult[];
}

@Injectable({ providedIn: 'root' })
export class ImportService {
  constructor(private httpClient: HttpClient) {}

  validateItems(facilityId: number, items: any[]): Observable<ApiResponse<ImportValidationReport>> {
    return this.httpClient.post<ApiResponse<ImportValidationReport>>(
      AppEnvironment.BASE_URL + EndPoints.IMPORTS.VALIDATE,
      { facilityId, items },
      { withCredentials: true }
    );
  }

  createImportRequest(
    facilityId: number,
    items: any[],
    departmentMappings: DepartmentMapping[]
  ): Observable<ApiResponse<ImportRequest>> {
    return this.httpClient.post<ApiResponse<ImportRequest>>(
      AppEnvironment.BASE_URL + EndPoints.IMPORTS.CREATE,
      { facilityId, items, departmentMappings },
      { withCredentials: true }
    );
  }

  getPendingRequests(): Observable<ApiResponse<ImportRequest[]>> {
    return this.httpClient.get<ApiResponse<ImportRequest[]>>(
      AppEnvironment.BASE_URL + EndPoints.IMPORTS.PENDING,
      { withCredentials: true }
    );
  }

  getHistory(facilityId: number): Observable<ApiResponse<ImportRequest[]>> {
    return this.httpClient.get<ApiResponse<ImportRequest[]>>(
      AppEnvironment.BASE_URL + EndPoints.IMPORTS.HISTORY(facilityId),
      { withCredentials: true }
    );
  }

  getById(id: number): Observable<ApiResponse<ImportRequest>> {
    return this.httpClient.get<ApiResponse<ImportRequest>>(
      AppEnvironment.BASE_URL + EndPoints.IMPORTS.GET_ONE(id),
      { withCredentials: true }
    );
  }

  reviewRequest(
    id: number,
    action: 'approve' | 'reject',
    reviewerNotes: string
  ): Observable<ApiResponse<ImportRequest>> {
    return this.httpClient.post<ApiResponse<ImportRequest>>(
      AppEnvironment.BASE_URL + EndPoints.IMPORTS.REVIEW(id),
      { action, reviewerNotes },
      { withCredentials: true }
    );
  }
}

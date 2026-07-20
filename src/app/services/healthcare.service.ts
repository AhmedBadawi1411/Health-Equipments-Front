import { Injectable, signal } from '@angular/core';
import { HttpClientWrapper } from './http-client-wrapper';
import { AppEnvironment } from '../environment';
import { Observable } from 'rxjs';

export interface Facility {
  id: number;
  facilityName: string;
  facilityLevel: string;
  healthZone: string;
  region: string;
  bedCapacity: number;
  director: string;
  inventoryStatus: 'NOT_STARTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  departments?: Department[];
  lat?: number | null;
  lng?: number | null;
  reviewNotes?: string;
}

export interface Department {
  id: number;
  departmentName: string;
  facilityId: number;
  createdAt: string;
}

// Master-Detail Inventory
export interface Inventory {
  facilityId: number;
  departmentId: number;
  surveyDate: string;
  surveyType: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  facility?: { facilityName: string };
  department?: { departmentName: string };
  items?: InventoryItem[];
}

export interface InventoryItem {
  id: number;
  departmentId: number;
  number: number;
  itemType?: string;
  scientificName: string;
  model: string;
  serialNumber: string;
  manufacturer: string;
  countryOfOrigin: string;
  manufacturingDate?: string;
  supplierCompany: string;
  installationDate: string;
  operationalStatus: string;
  createdAt: string;
  department?: { departmentName: string };
  itemImage?: string;
  itemImageBase64?: string | null;
  itemImageName?: string | null;
}

// Master-Detail Equipment & Consumables Needs
export interface NeedRequest {
  id: number;
  facilityId: number;
  departmentId: number;
  requestedBy: string;
  requestDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
  facility?: { facilityName: string };
  department?: { departmentName: string };
  items?: NeedItem[];
  pdfPath?: string;
  pdfName?: string;
  editRequested?: boolean;
  editAllowed?: boolean;
  editReason?: string;
  editDeclinedReason?: string;
  isNewDepartment?: boolean;
}

export interface NeedItem {
  id: number;
  needId: number;
  scientificName: string;
  requiredQuantity: number;
  currentQuantity: number;
  qualifiedStaff: string;
  infrastructureSpace: string;
  justifications: string;
  createdAt?: string;
}

// Master-Detail Maintenance
export interface MaintenanceRequest {
  id: number;
  facilityId: number;
  departmentId: number;
  requestDate: string;
  createdAt: string;
  facility?: { facilityName: string };
  department?: { departmentName: string };
  items?: MaintenanceRequestItem[];
}

export interface MaintenanceRequestItem {
  id: number;
  requestId: number;
  deviceName: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  manufacturer: string;
  countryOfOrigin: string;
  manufacturingDate?: string;
  maintenanceContract: string;
  contractNumber?: string;
  days?: number;
  months?: number;
  years?: number;
  warranty: string;
  deviceCondition: string;
  faultDescription: string;
  technicalEngineer: string;
  phoneNumber: string;
  headOfDepartment: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
  isInventoryApproved?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class HealthcareService {
  public readonly baseUrl = AppEnvironment.BASE_URL;

  public selectedFacilityId = signal<number | ''>('');
  public selectedDepartmentId = signal<number | ''>('');
  public selectedNeedRequestId = signal<number | ''>('');
  public activeNeedTab = signal<'equipment' | 'consumables'>('equipment');

  constructor(private readonly http: HttpClientWrapper) {
    const savedFac = localStorage.getItem('ss_selectedFacilityId');
    if (savedFac) {
      this.selectedFacilityId.set(Number(savedFac));
    }
    const savedDept = localStorage.getItem('ss_selectedDepartmentId');
    if (savedDept) {
      this.selectedDepartmentId.set(Number(savedDept));
    }
  }

  setSelectedFacilityId(id: number | '') {
    this.selectedFacilityId.set(id);
    if (id !== '') {
      localStorage.setItem('ss_selectedFacilityId', String(id));
    } else {
      localStorage.removeItem('ss_selectedFacilityId');
      localStorage.removeItem('ss_selectedDepartmentId');
      this.selectedDepartmentId.set('');
    }
  }

  setSelectedDepartmentId(id: number | '') {
    this.selectedDepartmentId.set(id);
    if (id !== '') {
      localStorage.setItem('ss_selectedDepartmentId', String(id));
    } else {
      localStorage.removeItem('ss_selectedDepartmentId');
    }
  }

  getFacilities(): Observable<ApiResponse<Facility[]>> {
    return this.http.get<ApiResponse<Facility[]>>(`${this.baseUrl}/facilities`);
  }

  getFacilityById(id: number): Observable<ApiResponse<Facility>> {
    return this.http.get<ApiResponse<Facility>>(`${this.baseUrl}/facilities/${id}`);
  }

  createFacility(facility: Omit<Facility, 'id' | 'inventoryStatus' | 'createdAt' | 'updatedAt' | 'departments'>): Observable<ApiResponse<Facility>> {
    return this.http.post<ApiResponse<Facility>>(`${this.baseUrl}/facilities`, facility);
  }

  submitInventory(facilityId: number): Observable<ApiResponse<Facility>> {
    return this.http.post<ApiResponse<Facility>>(`${this.baseUrl}/facilities/submit`, { facilityId });
  }

  approveInventory(facilityId: number, notes?: string): Observable<ApiResponse<Facility>> {
    return this.http.post<ApiResponse<Facility>>(`${this.baseUrl}/facilities/approve`, { facilityId, notes });
  }

  // Departments
  getDepartments(facilityId: number): Observable<ApiResponse<Department[]>> {
    return this.http.get<ApiResponse<Department[]>>(`${this.baseUrl}/facilities/${facilityId}/departments`);
  }

  createDepartment(facilityId: number, departmentName: string): Observable<ApiResponse<Department>> {
    return this.http.post<ApiResponse<Department>>(`${this.baseUrl}/facilities/${facilityId}/departments`, { departmentName });
  }

  updateDepartment(id: number, departmentName: string): Observable<ApiResponse<Department>> {
    return this.http.put<ApiResponse<Department>>(`${this.baseUrl}/departments/${id}`, { departmentName });
  }

  deleteDepartment(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/departments/${id}`);
  }

  // Inventory Surveys (Master-Detail)
  getInventory(facilityId?: number): Observable<ApiResponse<Inventory[]>> {
    const params: Record<string, string> = {};
    if (facilityId) params['facilityId'] = String(facilityId);
    return this.http.get<ApiResponse<Inventory[]>>(`${this.baseUrl}/inventory`, { params });
  }

  getInventoryById(facilityId: number, departmentId: number): Observable<ApiResponse<Inventory>> {
    return this.http.get<ApiResponse<Inventory>>(`${this.baseUrl}/inventory/${facilityId}/${departmentId}`);
  }

  addInventory(
    facilityId: number,
    payload: {
      surveyDate: string;
      surveyType: string;
      notes: string;
      departmentId: number;
      items: any[];
    }
  ): Observable<ApiResponse<Inventory>> {
    return this.http.post<ApiResponse<Inventory>>(`${this.baseUrl}/inventory`, {
      facilityId,
      ...payload
    });
  }

  updateInventory(facilityId: number, departmentId: number, data: any): Observable<ApiResponse<Inventory>> {
    return this.http.put<ApiResponse<Inventory>>(`${this.baseUrl}/inventory/${facilityId}/${departmentId}`, data);
  }

  deleteInventory(facilityId: number, departmentId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/inventory/${facilityId}/${departmentId}`);
  }

  // Needs Assessments - Equipment
  getEquipmentNeeds(facilityId?: number, departmentId?: number): Observable<ApiResponse<NeedRequest[]>> {
    const params: Record<string, string> = {};
    if (facilityId) params['facilityId'] = String(facilityId);
    if (departmentId) params['departmentId'] = String(departmentId);
    return this.http.get<ApiResponse<NeedRequest[]>>(`${this.baseUrl}/needs/equipment`, { params });
  }

  getEquipmentNeedById(id: number): Observable<ApiResponse<NeedRequest>> {
    return this.http.get<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/equipment/${id}`);
  }

  addEquipmentNeed(
    facilityId: number,
    departmentId: number,
    payload: {
      requestedBy: string;
      requestDate: string;
      items: any[];
    }
  ): Observable<ApiResponse<NeedRequest>> {
    return this.http.post<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/equipment`, {
      facilityId,
      departmentId,
      ...payload
    });
  }

  updateEquipmentNeed(id: number, data: any): Observable<ApiResponse<NeedRequest>> {
    return this.http.put<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/equipment/${id}`, data);
  }

  deleteEquipmentNeed(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/needs/equipment/${id}`);
  }

  // Needs Assessments - Consumables
  getConsumablesNeeds(facilityId?: number, departmentId?: number): Observable<ApiResponse<NeedRequest[]>> {
    const params: Record<string, string> = {};
    if (facilityId) params['facilityId'] = String(facilityId);
    if (departmentId) params['departmentId'] = String(departmentId);
    return this.http.get<ApiResponse<NeedRequest[]>>(`${this.baseUrl}/needs/consumables`, { params });
  }

  getConsumablesNeedById(id: number): Observable<ApiResponse<NeedRequest>> {
    return this.http.get<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/consumables/${id}`);
  }

  addConsumablesNeed(
    facilityId: number,
    departmentId: number,
    payload: {
      requestedBy: string;
      requestDate: string;
      items: any[];
    }
  ): Observable<ApiResponse<NeedRequest>> {
    return this.http.post<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/consumables`, {
      facilityId,
      departmentId,
      ...payload
    });
  }

  updateConsumablesNeed(id: number, data: any): Observable<ApiResponse<NeedRequest>> {
    return this.http.put<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/consumables/${id}`, data);
  }

  deleteConsumablesNeed(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/needs/consumables/${id}`);
  }

  // Maintenance Requests
  getMaintenanceRequests(facilityId?: number, departmentId?: number): Observable<ApiResponse<MaintenanceRequest[]>> {
    const params: Record<string, string> = {};
    if (facilityId) params['facilityId'] = String(facilityId);
    if (departmentId) params['departmentId'] = String(departmentId);
    return this.http.get<ApiResponse<MaintenanceRequest[]>>(`${this.baseUrl}/maintenance`, { params });
  }

  getMaintenanceRequestById(id: number): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.get<ApiResponse<MaintenanceRequest>>(`${this.baseUrl}/maintenance/${id}`);
  }

  addMaintenanceRequest(
    facilityId: number,
    departmentId: number,
    payload: {
      requestDate: string;
      items: any[];
    }
  ): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.post<ApiResponse<MaintenanceRequest>>(`${this.baseUrl}/maintenance`, {
      facilityId,
      departmentId,
      ...payload
    });
  }

  updateMaintenanceRequest(id: number, data: any): Observable<ApiResponse<MaintenanceRequest>> {
    return this.http.put<ApiResponse<MaintenanceRequest>>(`${this.baseUrl}/maintenance/${id}`, data);
  }

  deleteMaintenanceRequest(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/maintenance/${id}`);
  }

  updateFacility(id: number, data: any): Observable<ApiResponse<Facility>> {
    return this.http.put<ApiResponse<Facility>>(`${this.baseUrl}/facilities/${id}`, data);
  }

  deleteFacility(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/facilities/${id}`);
  }

  updateFacilityStatus(facilityId: number, status: string, notes?: string): Observable<ApiResponse<Facility>> {
    return this.http.post<ApiResponse<Facility>>(`${this.baseUrl}/facilities/status`, { facilityId, status, notes });
  }

  reviewNeedRequest(id: number, type: 'equipment' | 'consumables', status: 'PENDING' | 'APPROVED' | 'REJECTED', notes?: string): Observable<ApiResponse<NeedRequest>> {
    return this.http.post<ApiResponse<NeedRequest>>(`${this.baseUrl}/needs/${id}/review`, { type, status, notes });
  }

  getAuditLogs(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/audit-logs`);
  }

  getLifecycleLogs(entityType?: string, entityId?: number, facilityId?: number): Observable<ApiResponse<{ logs: any[], notes: any[] }>> {
    const params: Record<string, string> = {};
    if (entityType) params['entityType'] = entityType;
    if (entityId) params['entityId'] = String(entityId);
    if (facilityId) params['facilityId'] = String(facilityId);
    return this.http.get<ApiResponse<{ logs: any[], notes: any[] }>>(`${this.baseUrl}/lifecycle-logs`, { params });
  }

  requestNeedEdit(id: number, type: 'equipment' | 'consumables', reason: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/needs/${id}/request-edit`, { type, reason });
  }

  respondNeedEdit(id: number, type: 'equipment' | 'consumables', action: 'approve' | 'decline', declinedReason?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/needs/${id}/respond-edit`, { type, action, declinedReason });
  }

  getNeedEditHistory(id: number, type: 'equipment' | 'consumables'): Observable<ApiResponse<any[]>> {
    const params = { type };
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/needs/${id}/edit-history`, { params });
  }

  getNotifications(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/notifications`);
  }

  markNotificationRead(id: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/notifications/${id}/read`, {});
  }

  getStoredDepartments(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/utils/storedDepartment`);
  }

  createStoredDepartment(data: { arabicName: string; englishName: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/utils/storedDepartment`, data);
  }

  getStoredDevices(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/utils/storedDevice`);
  }

  createStoredDevice(data: { arabicName: string; englishName: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/utils/storedDevice`, data);
  }
}

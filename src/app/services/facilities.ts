import { computed, Injectable, signal } from '@angular/core';
import { AppEnvironment, EndPoints } from '../environment';
import { IFacility, FacilityForm } from '../interfaces/Facilities.Interface';
import { ApiResponse } from '../interfaces/Response.interface';
import { HttpClientWrapper } from './http-client-wrapper';
import { Observable } from 'rxjs';
import { IDepartment } from '../interfaces/Department.interface';
import { IRegion } from '../interfaces/Region.interface';

@Injectable({
  providedIn: 'root',
})
export class FacilitiesSerive {
  private facilitiesSignal = signal<IFacility[]>([]);
  private regionsSignal = signal<IRegion[]>([]);
  private departmentsSignal = signal<IDepartment[]>([]);

  private loadingSignal = signal(false);

  facilities = this.facilitiesSignal.asReadonly();
  departments = this.departmentsSignal.asReadonly();
  regions = this.regionsSignal.asReadonly();

  departmentsMap = computed(() => {
    const map = new Map<number, string>();

    this.departmentsSignal().forEach((d) => {
      map.set(d.departmentID, d.departmentName);
    });

    return map;
  });

  facilitiesMap = computed(() => {
    const map = new Map<number, string>();

    this.facilitiesSignal().forEach((f) => {
      map.set(f.facilityID, f.facilityName);
    });

    return map;
  });

  regionsMap = computed(() => {
    const map = new Map<number, string>();

    this.regionsSignal().forEach((f) => {
      map.set(f.regionID, f.regionName);
    });

    return map;
  });

  loading = this.loadingSignal.asReadonly();

  constructor(private readonly httpClient: HttpClientWrapper) {}

  private buildUrl(baseUrl: string, endPoint: string, params?: string[]) {
    return baseUrl + endPoint;
  }

  createFacility(facility: FacilityForm): Observable<ApiResponse<IFacility>> {
    return this.httpClient.post<ApiResponse<IFacility>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.FACILITIES.CREATE),
      facility
    );
  }

  createDepartment(payload: { departmentName: string; facilityID: number }): Observable<ApiResponse<IDepartment>> {
    return this.httpClient.post<ApiResponse<IDepartment>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.DEPARTMENTS.CREATE),
      payload
    );
  }

  loadFacilities(force = false) {
    if (this.facilitiesSignal().length>0 && !force) return;

    this.loadingSignal.set(true);

    this.httpClient
      .get<
        ApiResponse<IFacility[]>
      >(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.FACILITIES.GET))
      .subscribe({
        next: (res) => {
          this.facilitiesSignal.set(res.data);
          console.info("FACILITY DATA LOADED: ", res.data);
        },
        error: () => {},
        complete: () => this.loadingSignal.set(false),
      });
  }

  loadDepartments(facilityId: number) {
    this.httpClient
      .get<
        ApiResponse<IDepartment[]>
      >(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.FACILITIES.GET_DEPARTMENTS(facilityId)))
      .subscribe((res) => {
        console.info("FACILITTY DEPARTMENT DATA LOOADED: ", res.data);
        this.departmentsSignal.set(res.data);
      });
  }

  loadRegions() {
    this.httpClient
      .get<
        ApiResponse<IRegion[]>
      >(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.FACILITIES.REGIONS))
      .subscribe((res) => {
        console.info("REGIONS DATA LOADED: ", res.data);
        this.regionsSignal.set(res.data);
      });
  }

  getFacility(id: number): Observable<ApiResponse<IFacility>> {
    return this.httpClient.get<ApiResponse<IFacility>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.FACILITIES.GET_ONE(id))
    );
  }

  updateFacility(id: number, facility: FacilityForm): Observable<ApiResponse<IFacility>> {
    return this.httpClient.put<ApiResponse<IFacility>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.FACILITIES.UPDATE(id)),
      facility
    );
  }
}

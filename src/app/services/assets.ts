import { computed, Injectable, signal } from '@angular/core';
import { HttpClientWrapper } from './http-client-wrapper';
import { AppEnvironment, EndPoints } from '../environment';
import { map, catchError, of, Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/Response.interface';
import { IAssetMaster, IAsset } from '../interfaces/Assets.interface';

@Injectable({ providedIn: 'root' })
export class AssetsService {
  private assetMasterSignal = signal<IAssetMaster[]>([]);
  private assetsSignal = signal<IAsset[]>([]);

  assetMaster = this.assetMasterSignal.asReadonly();
  assets = this.assetsSignal.asReadonly();

  public assetMasterMap = computed(() => {
    const map = new Map<number, string>();
    this.assetMasterSignal().forEach(a => {
      map.set(a.equipmentTypeId, a.equipmentName);
    });
    return map;
  });

  constructor(private readonly httpClient: HttpClientWrapper) {}

  private buildUrl(baseUrl: string, endPoint: string): string {
    return baseUrl + endPoint;
  }

  loadAssetMaster(): void {
    this.httpClient
      .get<ApiResponse<IAssetMaster[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.GET_MASTER))
      .subscribe(res => {
        console.info('ASSET MASTER DATA LOADED: ', res.data);
        this.assetMasterSignal.set(res.data);
      });
  }

  loadAssets(force = false): void {
    if (this.assetsSignal().length > 0 && !force) return;
    this.httpClient
      .get<ApiResponse<IAsset[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.GET))
      .subscribe(res => {
        console.info('ASSETS LOADED: ', res.data);
        this.assetsSignal.set(res.data);
      });
  }

  createAsset(payload: any): Observable<ApiResponse<IAsset>> {
    return this.httpClient.post<ApiResponse<IAsset>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.CREATE),
      payload
    );
  }

  resolveSurveyToAsset(payload: any): Observable<ApiResponse<IAsset>> {
    return this.httpClient.post<ApiResponse<IAsset>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.RESOLVE_SURVEY),
      payload
    );
  }

  getAsset(id: number): Observable<ApiResponse<IAsset>> {
    return this.httpClient.get<ApiResponse<IAsset>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.GET_ONE(id))
    );
  }

  updateAsset(id: number, payload: any): Observable<ApiResponse<IAsset>> {
    return this.httpClient.put<ApiResponse<IAsset>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.UPDATE(id)),
      payload
    );
  }

  deleteAsset(id: number): Observable<ApiResponse<any>> {
    return this.httpClient.delete<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.DELETE(id))
    );
  }

  searchAssetBySerial(facilityId: number, serial: string): Observable<IAsset | null> {
    const url = `${this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.SEARCH_BY_FACILITY)}?facilityId=${facilityId}&serial=${encodeURIComponent(serial)}`;
    return this.httpClient
      .get<ApiResponse<IAsset>>(url)
      .pipe(
        map(res => res.data || null),
        catchError(() => of(null))
      );
  }

  createEquipmentMaster(payload: {
    equipmentName: string;
    categoryId: number;
    manufacturerId: number;
    model: string;
    expectedLifeYears?: number;
  }): Observable<ApiResponse<IAssetMaster>> {
    return this.httpClient.post<ApiResponse<IAssetMaster>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.ASSETS.GET_MASTER),
      payload
    );
  }
}

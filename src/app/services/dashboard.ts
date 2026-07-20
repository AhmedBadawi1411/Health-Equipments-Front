import { Injectable } from '@angular/core';
import { HttpClientWrapper } from './http-client-wrapper';
import { Observable } from 'rxjs';
import { AppEnvironment, EndPoints } from '../environment';
import { ApiResponse } from '../interfaces/Response.interface';

export interface IRecentActivity {
  title: string;
  detail: string;
  time: string;
  timeAgo: string;
  icon: string;
  color: string;
  type: string;
}

export interface IKpiInfo {
  value: number;
  trend: string;
  trendUp: boolean;
}

export interface IDashboardMetrics {
  kpis: {
    totalFacilities: IKpiInfo;
    totalAssets: IKpiInfo;
    needRequests: IKpiInfo;
    equipmentNeedRequests: IKpiInfo;
    consumablesNeedRequests: IKpiInfo;
    inventoryCampaigns: IKpiInfo;
  };
  barChartData: { label: string; value: number }[];
  inventoryDistribution: { name: string; value: number; color: string }[];
  inventoryStatusDistribution?: { name: string; value: number; color: string }[];
  monthlyNeedRequests: { month: string; count: number; equipmentCount?: number; consumablesCount?: number }[];
  overallAssetAvailability: number;
  recentActivities: IRecentActivity[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(private readonly http: HttpClientWrapper) {}

  getMetrics(regionId?: string | number, facilityId?: number): Observable<ApiResponse<IDashboardMetrics>> {
    const params: Record<string, string> = {};
    if (regionId) params['regionId'] = regionId.toString();
    if (facilityId) params['facilityId'] = facilityId.toString();

    return this.http.get<ApiResponse<IDashboardMetrics>>(
      AppEnvironment.BASE_URL + EndPoints.DASHBOARD.GET,
      { params }
    );
  }

  getLiveUpdates(regionId?: string | number, facilityId?: number): Observable<IDashboardMetrics> {
    return new Observable<IDashboardMetrics>((subscriber) => {
      const basePath = AppEnvironment.BASE_URL + EndPoints.DASHBOARD.LIVE;
      const url = basePath.startsWith('http://') || basePath.startsWith('https://')
        ? new URL(basePath)
        : new URL(basePath, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

      if (regionId) url.searchParams.append('regionId', regionId.toString());
      if (facilityId) url.searchParams.append('facilityId', facilityId.toString());

      const eventSource = new EventSource(url.toString(), {withCredentials:true});

      eventSource.onmessage = (event) => {
        try {
          const data: IDashboardMetrics = JSON.parse(event.data);
          subscriber.next(data);
        } catch (err) {
          subscriber.error(err);
        }
      };

      eventSource.onerror = (err) => {
        // Log error, but don't automatically crash the observable since standard browser EventSource
        // will automatically attempt to reconnect on failure
        console.warn('Dashboard EventSource encountered an error, attempting to reconnect...', err);
      };

      return () => {
        eventSource.close();
      };
    });
  }
}

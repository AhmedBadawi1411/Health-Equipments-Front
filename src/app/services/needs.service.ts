import { Injectable, signal } from '@angular/core';
import { HttpClientWrapper } from './http-client-wrapper';
import { INeedRequest } from '../interfaces/NeedRequest.interface';
import { ApiResponse } from '../interfaces/Response.interface';
import { AppEnvironment, EndPoints } from '../environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NeedsService {
  private requestsSignal = signal<any[]>([]);
  private loadingSignal = signal(false);

  public pendingLockMessage = false;

  requests = this.requestsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  constructor(private readonly httpClient: HttpClientWrapper) {}

  private buildUrl(baseUrl: string, endPoint: string, params?: string[]) {
    return baseUrl + endPoint;
  }

  loadNeedRequests(force = false) {
    if (this.requestsSignal().length > 0 && !force) return;
    this.loadingSignal.set(true);
    this.httpClient
      .get<ApiResponse<any[]>>(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.NEEDS.GET))
      .subscribe({
        next: (res) => {
          this.requestsSignal.set(res.data);
          console.info("NEED REQUESTS LOADED: ", res.data);
        },
        error: (err) => {
          console.error("FAILED TO LOAD NEED REQUESTS: ", err);
        },
        complete: () => this.loadingSignal.set(false),
      });
  }

  createNeedRequest(payload: INeedRequest): Observable<ApiResponse<any>> {
    return this.httpClient.post<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.NEEDS.CREATE),
      payload
    );
  }

  getNeedRequestById(id: number): Observable<ApiResponse<any>> {
    return this.httpClient.get<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.NEEDS.GET_ONE(id))
    );
  }

  updateNeedRequest(id: number, payload: any): Observable<ApiResponse<any>> {
    return this.httpClient.put<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.NEEDS.UPDATE(id)),
      payload
    );
  }

  deleteNeedRequest(id: number): Observable<ApiResponse<any>> {
    return this.httpClient.delete<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.NEEDS.DELETE(id))
    );
  }
}

import { Injectable, signal } from '@angular/core';
import { HttpClientWrapper } from './http-client-wrapper';
import { IInventorySurvey } from '../interfaces/Inventory.interface';
import { ApiResponse } from '../interfaces/Response.interface';
import { AppEnvironment, EndPoints } from '../environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private surveysSignal = signal<IInventorySurvey[]>([]);
  private loadingSignal = signal(false);

  surveys = this.surveysSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  constructor(private readonly httpClient: HttpClientWrapper) {}

  private buildUrl(baseUrl: string, endPoint: string) {
    return baseUrl + endPoint;
  }

  loadSurveys(force = false) {
    if (this.surveysSignal().length > 0 && !force) return;

    this.loadingSignal.set(true);

    this.httpClient
      .get<ApiResponse<IInventorySurvey[]>>(
        this.buildUrl(AppEnvironment.BASE_URL, EndPoints.INVENTORY.GET)
      )
      .subscribe({
        next: (res) => {
          this.surveysSignal.set(res.data);
          console.info('INVENTORY SURVEYS LOADED: ', res.data);
        },
        error: (err) => {
          console.error('FAILED TO LOAD INVENTORY SURVEYS: ', err);
        },
        complete: () => this.loadingSignal.set(false),
      });
  }

  createSurvey(payload: IInventorySurvey): Observable<ApiResponse<IInventorySurvey>> {
    return this.httpClient.post<ApiResponse<IInventorySurvey>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.INVENTORY.CREATE),
      payload
    );
  }

  updateSurvey(id: number, payload: IInventorySurvey): Observable<ApiResponse<IInventorySurvey>> {
    return this.httpClient.put<ApiResponse<IInventorySurvey>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.INVENTORY.UPDATE(id)),
      payload
    );
  }

  deleteSurvey(id: number): Observable<ApiResponse<any>> {
    return this.httpClient.delete<ApiResponse<any>>(
      this.buildUrl(AppEnvironment.BASE_URL, EndPoints.INVENTORY.DELETE(id))
    );
  }

  getSurveyById(id: number): Observable<ApiResponse<IInventorySurvey>> {
    return this.httpClient.get<ApiResponse<IInventorySurvey>>(
      this.buildUrl(AppEnvironment.BASE_URL, `/inventory-survey/${id}`)
    );
  }
}

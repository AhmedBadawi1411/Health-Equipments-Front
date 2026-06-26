import { Injectable, signal } from '@angular/core';
import { AppEnvironment, EndPoints } from '../environment';
import { IDepartment } from '../interfaces/Department.interface';
import { ApiResponse } from '../interfaces/Response.interface';
import { HttpClientWrapper } from './http-client-wrapper';

@Injectable({
  providedIn: 'root',
})
export class DepartmentsSerive {
  private departmentsSignal = signal<IDepartment[] | null>(null);
  private loadingSignal = signal(false);

  departments = this.departmentsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  constructor(private readonly httpClient: HttpClientWrapper) {}

  private buildUrl(baseUrl: string, endPoint: string, params?: string[]) {
    return baseUrl + endPoint;
  }

  loadDepartments(force = false) {
    if (this.departmentsSignal() && !force) return;

    this.loadingSignal.set(true);

    this.httpClient
      .get<
        ApiResponse<IDepartment[]>
      >(this.buildUrl(AppEnvironment.BASE_URL, EndPoints.DEPARTMENTS.GET))
      .subscribe({
        next: (res) => {
          console.log("DEPARTMENTS DATA: ", this.departments);
          
          this.departmentsSignal.set(res.data)},
        error: () => {},
        complete: () => this.loadingSignal.set(false),
      });
  }
}

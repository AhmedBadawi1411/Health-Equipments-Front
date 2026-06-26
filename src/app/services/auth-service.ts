import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../interfaces/Response.interface';
import { IUser } from '../interfaces/User.interface';
import { AppEnvironment, EndPoints } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public user = signal<IUser | null>(null);

  constructor(private httpClient: HttpClient) {}

  login(email: string, password: string): Observable<ApiResponse<IUser>> {
    return this.httpClient
      .post<ApiResponse<IUser>>(AppEnvironment.BASE_URL + EndPoints.AUTH.LOGIN, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.user.set(res.data);
        }),
      );
  }

  me(): Observable<ApiResponse<IUser>> {
    return this.httpClient
      .get<ApiResponse<IUser>>(AppEnvironment.BASE_URL + EndPoints.AUTH.VALIDATE_ME)
      .pipe(
        tap((res) => {
          this.user.set(res.data);
        }),
      );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.httpClient
      .post<ApiResponse<null>>(AppEnvironment.BASE_URL + EndPoints.AUTH.LOGOUT, {})
      .pipe(
        tap(() => {
          this.user.set(null);
        }),
      );
  }
}

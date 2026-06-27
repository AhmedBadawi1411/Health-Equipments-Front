import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../interfaces/Response.interface';
import { IUser } from '../interfaces/User.interface';
import { AppEnvironment, EndPoints } from '../environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Current authenticated user (null if not logged in) */
  public user = signal<IUser | null>(null);

  /** Computed: list of permission codes for the current user */
  readonly permissions = computed(() => {
    const u = this.user();
    if (!u) return [] as string[];
    // permissions are IPermission objects with a code field
    return (u.permissions ?? []).map((p: any) =>
      typeof p === 'string' ? p : (p.code ?? '')
    ).filter(Boolean) as string[];
  });

  constructor(private httpClient: HttpClient) {}

  /**
   * Check if current user has a specific permission.
   * @param permission Permission code, e.g. 'user:create'
   */
  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  login(email: string, password: string): Observable<ApiResponse<IUser>> {
    // Backend sets httpOnly cookies (accessToken + refreshToken) on success.
    // withCredentials is required so the browser stores and sends those cookies.
    return this.httpClient
      .post<ApiResponse<IUser>>(
        AppEnvironment.BASE_URL + EndPoints.AUTH.LOGIN,
        { email, password },
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          this.user.set(res.data);
        }),
      );
  }

  me(): Observable<ApiResponse<IUser>> {
    return this.httpClient
      .get<ApiResponse<IUser>>(
        AppEnvironment.BASE_URL + EndPoints.AUTH.VALIDATE_ME,
        { withCredentials: true },
      )
      .pipe(
        tap((res) => {
          this.user.set(res.data);
        }),
      );
  }

  logout(): Observable<ApiResponse<null>> {
    return this.httpClient
      .post<ApiResponse<null>>(
        AppEnvironment.BASE_URL + EndPoints.AUTH.LOGOUT,
        {},
        { withCredentials: true },
      )
      .pipe(
        tap(() => {
          this.user.set(null);
        }),
      );
  }
}

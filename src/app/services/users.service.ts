import { Injectable, signal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpClientWrapper } from './http-client-wrapper';
import { AppEnvironment, EndPoints } from '../environment';
import { ApiResponse } from '../interfaces/Response.interface';
import { IUser, IUserForm, IRole, IPermission } from '../interfaces/User.interface';

@Injectable({ providedIn: 'root' })
export class UsersService {

  // ── Signals ────────────────────────────────────────────────────────────────
  private usersSignal      = signal<IUser[]>([]);
  private rolesSignal      = signal<IRole[]>([]);
  private permissionsSignal= signal<IPermission[]>([]);
  private loadingSignal    = signal(false);

  users       = this.usersSignal.asReadonly();
  roles       = this.rolesSignal.asReadonly();
  permissions = this.permissionsSignal.asReadonly();
  loading     = this.loadingSignal.asReadonly();

  /** Map: userId → IUser (for quick lookup) */
  usersMap = computed(() => {
    const m = new Map<string, IUser>();
    this.usersSignal().forEach(u => m.set(u.id, u));
    return m;
  });

  /** Permissions grouped by module */
  permissionsByModule = computed(() => {
    const map = new Map<string, IPermission[]>();
    this.permissionsSignal().forEach(p => {
      const list = map.get(p.module) ?? [];
      list.push(p);
      map.set(p.module, list);
    });
    return map;
  });

  constructor(private readonly http: HttpClientWrapper) {}

  private url(endpoint: string): string {
    return AppEnvironment.BASE_URL + endpoint;
  }

  // ── Load ───────────────────────────────────────────────────────────────────
  loadUsers(): void {
    this.loadingSignal.set(true);
    this.http.get<ApiResponse<IUser[]>>(this.url(EndPoints.USERS.GET))
      .subscribe({
        next: res => {
          this.usersSignal.set(res.data ?? []);
          this.loadingSignal.set(false);
        },
        error: () => this.loadingSignal.set(false),
      });
  }

  loadRoles(): void {
    this.http.get<ApiResponse<IRole[]>>(this.url(EndPoints.USERS.ROLES))
      .subscribe(res => this.rolesSignal.set(res.data ?? []));
  }

  loadPermissions(): void {
    this.http.get<ApiResponse<IPermission[]>>(this.url(EndPoints.USERS.PERMISSIONS))
      .subscribe(res => this.permissionsSignal.set(res.data ?? []));
  }

  getUser(id: string): Observable<ApiResponse<IUser>> {
    return this.http.get<ApiResponse<IUser>>(this.url(EndPoints.USERS.GET_ONE(id)));
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────
  createUser(data: IUserForm): Observable<ApiResponse<IUser>> {
    return this.http.post<ApiResponse<IUser>>(this.url(EndPoints.USERS.CREATE), data);
  }

  updateUser(id: string, data: IUserForm): Observable<ApiResponse<IUser>> {
    return this.http.put<ApiResponse<IUser>>(this.url(EndPoints.USERS.UPDATE(id)), data);
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(this.url(EndPoints.USERS.DELETE(id)));
  }

  // ── Role & Permissions ─────────────────────────────────────────────────────
  assignRole(userId: string, roleId: string): Observable<ApiResponse<IUser>> {
    return this.http.patch<ApiResponse<IUser>>(
      this.url(EndPoints.USERS.ASSIGN_ROLE(userId)),
      { roleId }
    );
  }

  assignPermissions(userId: string, permissionIds: string[]): Observable<ApiResponse<IUser>> {
    return this.http.patch<ApiResponse<IUser>>(
      this.url(EndPoints.USERS.ASSIGN_PERMISSIONS(userId)),
      { permissionIds }
    );
  }

  assignFacilities(userId: string, facilityIds: number[]): Observable<ApiResponse<IUser>> {
    return this.http.patch<ApiResponse<IUser>>(
      this.url(EndPoints.USERS.ASSIGN_FACILITIES(userId)),
      { facilityIds }
    );
  }
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import {
  AppRole,
  AuthResponse,
  CompleteRegistrationRequest,
  CurrentUserResponse,
  LoginRequest,
} from '../models/auth.models';
import { AuthApiService } from './auth-api.service';

const TOKEN_KEY = 'iquitosDelivery.ops.token';
const USER_KEY = 'iquitosDelivery.ops.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApiService);

  private readonly tokenState = signal<string | null>(this.readValue(TOKEN_KEY));
  private readonly userState = signal<CurrentUserResponse | null>(this.readUser());
  private readonly readyState = signal(false);

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly authReady = this.readyState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenState() && !!this.userState()?.isAuthenticated);
  readonly currentRole = computed(() => this.userState()?.role ?? null);

  login(request: LoginRequest): Observable<CurrentUserResponse> {
    return this.authApi.login(request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  completeRestaurantRegistration(request: CompleteRegistrationRequest): Observable<CurrentUserResponse> {
    return this.authApi.completeRestaurantRegistration(request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  completeDriverRegistration(request: CompleteRegistrationRequest): Observable<CurrentUserResponse> {
    return this.authApi.completeDriverRegistration(request).pipe(
      tap((response) => this.handleAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  async restoreSession(): Promise<void> {
    const token = this.tokenState();

    if (!token) {
      this.readyState.set(true);
      return;
    }

    await firstValueFrom(
      this.authApi.getCurrentUser().pipe(
        tap((user) => {
          if (!this.isOpsRole(user.role)) {
            this.clearSession();
            return;
          }

          this.setCurrentUser(user);
        }),
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
      ),
    );

    this.readyState.set(true);
  }

  logout(): void {
    this.clearSession();
  }

  getToken(): string | null {
    return this.tokenState();
  }

  getCurrentRole(): AppRole | string | null {
    return this.currentRole();
  }

  hasValidOpsSession(): boolean {
    return this.isAuthenticated() && this.isOpsRole();
  }

  getDefaultRoute(role: AppRole | string | null = this.currentRole()): string {
    switch (role) {
      case 'Restaurant':
        return '/restaurant/dashboard';
      case 'Driver':
        return '/driver/dashboard';
      case 'Admin':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  }

  isOpsRole(role: AppRole | string | null = this.currentRole()): boolean {
    return role === 'Restaurant' || role === 'Driver' || role === 'Admin';
  }

  private handleAuthResponse(response: AuthResponse): void {
    const currentUser = this.mapAuthResponseToCurrentUser(response);
    this.tokenState.set(response.token);
    this.userState.set(currentUser);
    this.writeValue(TOKEN_KEY, response.token);
    this.writeUser(currentUser);
    this.readyState.set(true);
  }

  private setCurrentUser(user: CurrentUserResponse): void {
    this.userState.set(user);
    this.writeUser(user);
  }

  private mapAuthResponseToCurrentUser(response: AuthResponse): CurrentUserResponse {
    return {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
      status: response.status,
      isAuthenticated: true,
    };
  }

  private clearSession(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.readyState.set(true);
    this.removeValue(TOKEN_KEY);
    this.removeValue(USER_KEY);
  }

  private readUser(): CurrentUserResponse | null {
    const raw = this.readValue(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUserResponse;
    } catch {
      return null;
    }
  }

  private writeUser(user: CurrentUserResponse): void {
    this.writeValue(USER_KEY, JSON.stringify(user));
  }

  private readValue(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeValue(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Keep auth usable even if storage is restricted.
    }
  }

  private removeValue(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Keep auth usable even if storage is restricted.
    }
  }
}

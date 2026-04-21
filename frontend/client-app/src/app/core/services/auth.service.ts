import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import {
  AuthResponse,
  CompleteCustomerRegistrationRequest,
  CurrentUserResponse,
  LoginRequest,
  ResendCustomerRegistrationCodeRequest,
  StartCustomerRegistrationRequest,
  UserRole,
  VerificationCodeResponse,
  VerificationStatusResponse,
  VerifyCustomerRegistrationCodeRequest,
} from '../models/auth.models';
import { AuthApiService } from './auth-api.service';

const TOKEN_KEY = 'iquitosDelivery.client.token';
const USER_KEY = 'iquitosDelivery.client.user';

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
      tap((response) => this.authenticateWithResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  startCustomerRegistration(request: StartCustomerRegistrationRequest): Observable<VerificationCodeResponse> {
    return this.authApi.startCustomerRegistration(request);
  }

  verifyCustomerRegistrationCode(
    request: VerifyCustomerRegistrationCodeRequest,
  ): Observable<VerificationStatusResponse> {
    return this.authApi.verifyCustomerRegistrationCode(request);
  }

  resendCustomerRegistrationCode(
    request: ResendCustomerRegistrationCodeRequest,
  ): Observable<VerificationCodeResponse> {
    return this.authApi.resendCustomerRegistrationCode(request);
  }

  completeCustomerRegistration(request: CompleteCustomerRegistrationRequest): Observable<CurrentUserResponse> {
    return this.authApi.completeCustomerRegistration(request).pipe(
      tap((response) => this.authenticateWithResponse(response)),
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
        tap((user) => this.setCurrentUser(user)),
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

  getCurrentRole(): UserRole | string | null {
    return this.currentRole();
  }

  private authenticateWithResponse(response: AuthResponse): void {
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
      // Ignore storage failures to keep auth flow working in restricted contexts.
    }
  }

  private removeValue(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore storage failures to keep auth flow working in restricted contexts.
    }
  }
}

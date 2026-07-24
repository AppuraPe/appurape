import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, tap } from 'rxjs';
import {
  AuthResponse,
  CompleteCustomerRegistrationRequest,
  CompleteRegistrationRequest,
  CurrentUserResponse,
  GoogleLoginRequest,
  LoginRequest,
  ResendCustomerRegistrationCodeRequest,
  ResendRegistrationCodeRequest,
  StartCustomerRegistrationRequest,
  StartDriverRegistrationRequest,
  UserRole,
  VerificationCodeResponse,
  VerificationStatusResponse,
  VerifyRegistrationCodeRequest,
} from '../models/auth.models';
import { AuthApiService } from './auth-api.service';
import { PushNotificationService } from '../notifications/push-notification.service';
import { AuthSessionStore } from '@app/shared/core/auth/auth-session.store';
import { getDefaultRouteForRole, isOpsRole as isOpsRoleHelper } from '@app/shared/core/auth/role.utils';

const TOKEN_KEY = 'iquitosDelivery.app.token';
const USER_KEY = 'iquitosDelivery.app.user';

@Injectable({ providedIn: 'root' })
export class AuthService extends AuthSessionStore {
  private readonly authApi = inject(AuthApiService);
  private readonly pushNotificationService = inject(PushNotificationService);

  private readonly tokenState = signal<string | null>(this.readStoredToken());
  private readonly userState = signal<CurrentUserResponse | null>(this.readStoredUser());
  private readonly readyState = signal(false);
  private sessionExpiredHandled = false;

  readonly token = this.tokenState.asReadonly();
  readonly currentUser = this.userState.asReadonly();
  readonly authReady = this.readyState.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenState() && !!this.userState()?.isAuthenticated);
  readonly currentRole = computed(() => this.userState()?.role ?? null);

  constructor() {
    super({
      tokenKey: TOKEN_KEY,
      userKey: USER_KEY,
    });
  }

  login(request: LoginRequest): Observable<CurrentUserResponse> {
    return this.authApi.login(request).pipe(
      tap((response) => this.applyAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  loginWithGoogle(request: GoogleLoginRequest): Observable<CurrentUserResponse> {
    return this.authApi.loginWithGoogle(request).pipe(
      tap((response) => this.applyAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  startCustomerRegistration(request: StartCustomerRegistrationRequest): Observable<VerificationCodeResponse> {
    return this.authApi.startCustomerRegistration(request);
  }

  verifyCustomerRegistrationCode(
    request: VerifyRegistrationCodeRequest,
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
      tap((response) => this.applyAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  startRestaurantRegistration(request: FormData): Observable<VerificationCodeResponse> {
    return this.authApi.startRestaurantRegistration(request);
  }

  verifyRestaurantRegistrationCode(request: VerifyRegistrationCodeRequest): Observable<VerificationStatusResponse> {
    return this.authApi.verifyRestaurantRegistrationCode(request);
  }

  resendRestaurantRegistrationCode(
    request: ResendRegistrationCodeRequest,
  ): Observable<VerificationCodeResponse> {
    return this.authApi.resendRestaurantRegistrationCode(request);
  }

  completeRestaurantRegistration(request: CompleteRegistrationRequest): Observable<CurrentUserResponse> {
    return this.authApi.completeRestaurantRegistration(request).pipe(
      tap((response) => this.applyAuthResponse(response)),
      map((response) => this.mapAuthResponseToCurrentUser(response)),
    );
  }

  startDriverRegistration(request: FormData): Observable<VerificationCodeResponse> {
    return this.authApi.startDriverRegistration(request);
  }

  verifyDriverRegistrationCode(request: VerifyRegistrationCodeRequest): Observable<VerificationStatusResponse> {
    return this.authApi.verifyDriverRegistrationCode(request);
  }

  resendDriverRegistrationCode(request: ResendRegistrationCodeRequest): Observable<VerificationCodeResponse> {
    return this.authApi.resendDriverRegistrationCode(request);
  }

  completeDriverRegistration(request: CompleteRegistrationRequest): Observable<CurrentUserResponse> {
    return this.authApi.completeDriverRegistration(request).pipe(
      tap((response) => this.applyAuthResponse(response)),
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
          this.setCurrentUser(user);
          this.syncPushNotifications();
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
    this.sessionExpiredHandled = false;
    this.pushNotificationService.deactivateCurrentDeviceToken(this.tokenState());
    this.clearSession();
  }

  expireSession(): boolean {
    if (!this.tokenState() && !this.userState()) {
      return false;
    }

    if (this.sessionExpiredHandled) {
      return false;
    }

    this.sessionExpiredHandled = true;
    this.pushNotificationService.deactivateCurrentDeviceToken(this.tokenState());
    this.clearSession();
    return true;
  }

  hasValidOpsSession(): boolean {
    return this.isAuthenticated() && this.isOpsRole();
  }

  hasValidSession(): boolean {
    return this.isAuthenticated();
  }

  getDefaultRoute(role: UserRole | string | null = this.getCurrentRole()): string {
    return getDefaultRouteForRole(role);
  }

  override isOpsRole(role: UserRole | string | null = this.getCurrentRole()): boolean {
    return isOpsRoleHelper(role);
  }

  getToken(): string | null {
    return this.tokenState();
  }

  getCurrentRole(): UserRole | string | null {
    return this.currentRole();
  }

  private applyAuthResponse(response: AuthResponse): void {
    const currentUser = this.writeAuthResponse(response);
    this.sessionExpiredHandled = false;
    this.tokenState.set(response.token);
    this.userState.set(currentUser);
    this.readyState.set(true);
    this.syncPushNotifications();
  }

  private setCurrentUser(user: CurrentUserResponse): void {
    this.writeCurrentUser(user);
    this.userState.set(user);
  }

  private clearSession(): void {
    this.tokenState.set(null);
    this.userState.set(null);
    this.readyState.set(true);
    this.clearStoredSession();
  }

  private syncPushNotifications(): void {
    const token = this.tokenState();
    const user = this.userState();

    if (!token || !user?.userId || !user.role) {
      return;
    }

    void this.pushNotificationService.initializeForAuthenticatedUser({
      authToken: token,
      userId: user.userId,
      role: user.role,
    });
  }
}

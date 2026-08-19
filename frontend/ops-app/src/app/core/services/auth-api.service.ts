import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CompleteCustomerRegistrationRequest,
  CompleteRegistrationRequest,
  CurrentUserResponse,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  ResetPasswordRequest,
  ResendCustomerRegistrationCodeRequest,
  ResendPasswordResetCodeRequest,
  ResendRegistrationCodeRequest,
  StartCustomerRegistrationRequest,
  SwitchProfileRequest,
  VerificationCodeResponse,
  VerificationStatusResponse,
  VerifyCustomerRegistrationCodeRequest,
  VerifyRegistrationCodeRequest,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
  }

  loginWithGoogle(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/google`, request);
  }

  startPasswordReset(request: ForgotPasswordRequest): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/password/forgot`, request);
  }

  resendPasswordResetCode(request: ResendPasswordResetCodeRequest): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/password/resend-code`, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(`${this.baseUrl}/password/reset`, request);
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.baseUrl}/me`);
  }

  startCustomerRegistration(request: StartCustomerRegistrationRequest): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/register/customer/start`, request);
  }

  verifyCustomerRegistrationCode(
    request: VerifyCustomerRegistrationCodeRequest,
  ): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(`${this.baseUrl}/register/customer/verify-code`, request);
  }

  resendCustomerRegistrationCode(
    request: ResendCustomerRegistrationCodeRequest,
  ): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/register/customer/resend-code`, request);
  }

  completeCustomerRegistration(request: CompleteCustomerRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/customer/complete`, request);
  }

  startRestaurantRegistration(request: FormData): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/register/restaurant/start`, request);
  }

  verifyRestaurantRegistrationCode(request: VerifyRegistrationCodeRequest): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(`${this.baseUrl}/register/restaurant/verify-code`, request);
  }

  resendRestaurantRegistrationCode(request: ResendRegistrationCodeRequest): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/register/restaurant/resend-code`, request);
  }

  completeRestaurantRegistration(request: CompleteRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/restaurant/complete`, request);
  }

  startDriverRegistration(request: FormData): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/register/driver/start`, request);
  }

  verifyDriverRegistrationCode(request: VerifyRegistrationCodeRequest): Observable<VerificationStatusResponse> {
    return this.http.post<VerificationStatusResponse>(`${this.baseUrl}/register/driver/verify-code`, request);
  }

  resendDriverRegistrationCode(request: ResendRegistrationCodeRequest): Observable<VerificationCodeResponse> {
    return this.http.post<VerificationCodeResponse>(`${this.baseUrl}/register/driver/resend-code`, request);
  }

  completeDriverRegistration(request: CompleteRegistrationRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register/driver/complete`, request);
  }

  switchProfile(request: SwitchProfileRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/switch-profile`, request);
  }
}

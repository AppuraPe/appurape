import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AuthResponse,
  CompleteCustomerRegistrationRequest,
  CurrentUserResponse,
  LoginRequest,
  ResendCustomerRegistrationCodeRequest,
  StartCustomerRegistrationRequest,
  VerificationCodeResponse,
  VerificationStatusResponse,
  VerifyCustomerRegistrationCodeRequest,
} from '../models/auth.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/auth');

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
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

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.baseUrl}/me`);
  }
}

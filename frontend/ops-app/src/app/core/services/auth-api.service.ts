import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  CompleteRegistrationRequest,
  CurrentUserResponse,
  LoginRequest,
  ResendRegistrationCodeRequest,
  VerificationCodeResponse,
  VerificationStatusResponse,
  VerifyRegistrationCodeRequest,
} from '../models/auth.models';
import { StartDriverRegistrationRequest } from '../models/driver.models';
import { StartRestaurantRegistrationRequest } from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request);
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.baseUrl}/me`);
  }

  startRestaurantRegistration(request: StartRestaurantRegistrationRequest): Observable<VerificationCodeResponse> {
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

  startDriverRegistration(request: StartDriverRegistrationRequest): Observable<VerificationCodeResponse> {
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
}

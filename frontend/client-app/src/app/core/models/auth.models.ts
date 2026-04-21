export type UserRole = 'Customer' | 'Restaurant' | 'Driver' | 'Admin';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface StartCustomerRegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export interface VerifyCustomerRegistrationCodeRequest {
  email: string;
  code: string;
}

export interface ResendCustomerRegistrationCodeRequest {
  email: string;
}

export interface CompleteCustomerRegistrationRequest {
  email: string;
  code: string;
  password: string;
}

export interface VerificationCodeResponse {
  message: string;
  expiresInMinutes: number;
  email: string;
}

export interface VerificationStatusResponse {
  email: string;
  isVerified: boolean;
  message: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole | string;
  status: string;
}

export interface CurrentUserResponse {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole | string;
  status: string;
  isAuthenticated: boolean;
}

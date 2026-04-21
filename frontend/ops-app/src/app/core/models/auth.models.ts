export type AppRole = 'Customer' | 'Restaurant' | 'Driver' | 'Admin';
export type OpsRole = Exclude<AppRole, 'Customer'>;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: AppRole | string;
  status: string;
}

export interface CurrentUserResponse {
  userId: string;
  fullName: string;
  email: string;
  role: AppRole | string;
  status: string;
  isAuthenticated: boolean;
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

export interface VerifyRegistrationCodeRequest {
  email: string;
  code: string;
}

export interface ResendRegistrationCodeRequest {
  email: string;
}

export interface CompleteRegistrationRequest {
  email: string;
  code: string;
  password: string;
}

export type AppRole = 'Customer' | 'Restaurant' | 'Driver' | 'Admin';
export type UserRole = AppRole;
export type AppProfile = 'Customer' | 'BusinessOwner' | 'Driver' | 'Collaborator' | 'Admin';
export type OpsRole = Exclude<AppRole, 'Customer'>;
export type TrustLevel = 'Verified' | 'Trusted';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResendPasswordResetCodeRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface SwitchProfileRequest {
  profile: AppProfile | string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: AppRole | string;
  primaryRole?: AppRole | string;
  activeProfile?: AppProfile | string;
  status: string;
  trustLevel?: TrustLevel | string | null;
  trustScore?: number | null;
  communityCollaborationLevel?: string | null;
  communityTrustScore?: number | null;
  communityAvailabilityStatus?: string | null;
  isCommunityAvailable?: boolean | null;
  hasCustomerProfile?: boolean;
  hasBusinessProfile?: boolean;
  hasDriverProfile?: boolean;
  hasCollaboratorProfile?: boolean;
  collaboratorApprovalStatus?: string | null;
  isCollaboratorIdentityVerified?: boolean | null;
  availableProfiles?: (AppProfile | string)[];
}

export interface CurrentUserResponse {
  userId: string;
  fullName: string;
  email: string;
  role: AppRole | string;
  primaryRole?: AppRole | string;
  activeProfile?: AppProfile | string;
  status: string;
  trustLevel?: TrustLevel | string | null;
  trustScore?: number | null;
  communityCollaborationLevel?: string | null;
  communityTrustScore?: number | null;
  communityAvailabilityStatus?: string | null;
  isCommunityAvailable?: boolean | null;
  hasCustomerProfile?: boolean;
  hasBusinessProfile?: boolean;
  hasDriverProfile?: boolean;
  hasCollaboratorProfile?: boolean;
  collaboratorApprovalStatus?: string | null;
  isCollaboratorIdentityVerified?: boolean | null;
  availableProfiles?: (AppProfile | string)[];
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
  acceptedDocumentIds: string[];
  platform?: string;
  appVersion?: string | null;
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
  acceptedDocumentIds: string[];
  platform?: string;
  appVersion?: string | null;
}

export interface StartRestaurantRegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  restaurantName: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
  openTime: string;
  closeTime: string;
}

export interface StartDriverRegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleType: number;
  plate: string;
  zoneId: string;
}

export interface VerifyRestaurantRegistrationCodeRequest {
  email: string;
  code: string;
}

export interface VerifyDriverRegistrationCodeRequest {
  email: string;
  code: string;
}

export interface ResendRestaurantRegistrationCodeRequest {
  email: string;
}

export interface ResendDriverRegistrationCodeRequest {
  email: string;
}

export interface CompleteRestaurantRegistrationRequest {
  email: string;
  code: string;
  password: string;
  acceptedDocumentIds: string[];
  platform?: string;
  appVersion?: string | null;
}

export interface CompleteDriverRegistrationRequest {
  email: string;
  code: string;
  password: string;
  acceptedDocumentIds: string[];
  platform?: string;
  appVersion?: string | null;
}

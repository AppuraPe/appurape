import { AuthResponse, CurrentUserResponse } from '../models/auth.models';

export interface AuthStorageKeys {
  tokenKey: string;
  userKey: string;
}

export abstract class AuthSessionStore {
  protected constructor(private readonly storageKeys: AuthStorageKeys) {}

  protected readStoredToken(): string | null {
    return this.readValue(this.storageKeys.tokenKey);
  }

  protected readStoredUser(): CurrentUserResponse | null {
    const raw = this.readValue(this.storageKeys.userKey);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as CurrentUserResponse;
    } catch {
      return null;
    }
  }

  protected writeAuthResponse(response: AuthResponse): CurrentUserResponse {
    const currentUser = this.mapAuthResponseToCurrentUser(response);
    this.writeValue(this.storageKeys.tokenKey, response.token);
    this.writeValue(this.storageKeys.userKey, JSON.stringify(currentUser));
    return currentUser;
  }

  protected writeCurrentUser(user: CurrentUserResponse): void {
    this.writeValue(this.storageKeys.userKey, JSON.stringify(user));
  }

  protected clearStoredSession(): void {
    this.removeValue(this.storageKeys.tokenKey);
    this.removeValue(this.storageKeys.userKey);
  }

  protected mapAuthResponseToCurrentUser(response: AuthResponse): CurrentUserResponse {
    return {
      userId: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
      status: response.status,
      trustLevel: response.trustLevel ?? null,
      trustScore: response.trustScore ?? null,
      communityCollaborationLevel: response.communityCollaborationLevel ?? null,
      communityTrustScore: response.communityTrustScore ?? null,
      communityAvailabilityStatus: response.communityAvailabilityStatus ?? null,
      isCommunityAvailable: response.isCommunityAvailable ?? null,
      isAuthenticated: true,
    };
  }

  protected getDefaultRouteForRole(role: CurrentUserResponse['role'] | null | undefined): string {
    switch (role) {
      case 'Restaurant':
        return '/restaurant/dashboard';
      case 'Driver':
        return '/driver/dashboard';
      case 'Admin':
        return '/admin/dashboard';
      case 'Customer':
        return '/businesses';
      default:
        return '/login';
    }
  }

  protected isOpsRole(role: CurrentUserResponse['role'] | null | undefined): boolean {
    return role === 'Restaurant' || role === 'Driver' || role === 'Admin';
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

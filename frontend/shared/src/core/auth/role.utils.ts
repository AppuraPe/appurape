import { AppRole, OpsRole } from '../models/auth.models';

export function isOpsRole(role: AppRole | string | null | undefined): role is OpsRole {
  return role === 'Restaurant' || role === 'Driver' || role === 'Admin';
}

export function getDefaultRouteForRole(role: AppRole | string | null | undefined): string {
  switch (role) {
    case 'Restaurant':
      return '/restaurant/dashboard';
    case 'Driver':
      return '/driver/dashboard';
    case 'Admin':
      return '/admin/dashboard';
    case 'Customer':
      return '/restaurants';
    default:
      return '/login';
  }
}

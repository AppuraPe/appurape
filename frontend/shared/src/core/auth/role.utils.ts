import { AppProfile, AppRole, OpsRole } from '../models/auth.models';

export function isOpsRole(role: AppRole | string | null | undefined): role is OpsRole {
  return role === 'Restaurant' || role === 'Driver' || role === 'Admin';
}

export function isCustomerRole(role: AppRole | string | null | undefined): boolean {
  return role === 'Customer';
}

export function isBusinessRole(role: AppRole | string | null | undefined): boolean {
  return role === 'Restaurant' || role === 'Business' || role === 'BusinessOwner' || role === 'RestaurantOwner';
}

export function isDriverRole(role: AppRole | string | null | undefined): boolean {
  return role === 'Driver' || role === 'Courier';
}

export function isAdminRole(role: AppRole | string | null | undefined): boolean {
  return role === 'Admin' || role === 'InternalAdmin';
}

export function profileToEffectiveRole(profile: AppProfile | string | null | undefined): AppRole {
  switch (profile) {
    case 'BusinessOwner':
    case 'Restaurant':
      return 'Restaurant';
    case 'Driver':
      return 'Driver';
    case 'Admin':
      return 'Admin';
    case 'Customer':
    case 'Collaborator':
    default:
      return 'Customer';
  }
}

export function roleToDefaultProfile(role: AppRole | string | null | undefined): AppProfile {
  switch (role) {
    case 'Restaurant':
    case 'Business':
    case 'BusinessOwner':
      return 'BusinessOwner';
    case 'Driver':
      return 'Driver';
    case 'Admin':
      return 'Admin';
    case 'Customer':
    default:
      return 'Customer';
  }
}

export function getDefaultRouteForProfile(profile: AppProfile | string | null | undefined): string {
  switch (profile) {
    case 'BusinessOwner':
    case 'Restaurant':
      return '/business/dashboard';
    case 'Driver':
      return '/driver/dashboard';
    case 'Admin':
      return '/admin/dashboard';
    case 'Collaborator':
      return '/community';
    case 'Customer':
    default:
      return '/businesses';
  }
}

export function getProfileDisplayName(profile: AppProfile | string | null | undefined): string {
  switch (profile) {
    case 'BusinessOwner':
    case 'Restaurant':
      return 'Negocio';
    case 'Driver':
      return 'Repartidor';
    case 'Admin':
      return 'Administrador';
    case 'Collaborator':
      return 'Colaborador';
    case 'Customer':
    default:
      return 'Cliente';
  }
}

export function getDefaultRouteForRole(role: AppRole | string | null | undefined): string {
  switch (role) {
    case 'Restaurant':
      return '/business/dashboard';
    case 'Driver':
      return '/driver/dashboard';
    case 'Admin':
      return '/admin/dashboard';
    case 'Customer':
      return '/businesses';
    default:
      return '/businesses';
  }
}

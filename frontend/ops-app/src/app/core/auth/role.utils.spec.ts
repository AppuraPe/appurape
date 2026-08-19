import { describe, expect, it } from 'vitest';
import {
  getDefaultRouteForProfile,
  getDefaultRouteForRole,
  getProfileDisplayName,
  isAdminRole,
  isBusinessRole,
  isCustomerRole,
  isDriverRole,
  isOpsRole,
  profileToEffectiveRole,
  roleToDefaultProfile,
} from '@app/shared/core/auth/role.utils';

describe('role and profile utils', () => {
  it('maps profile to effective role correctly', () => {
    expect(profileToEffectiveRole('Customer')).toBe('Customer');
    expect(profileToEffectiveRole('BusinessOwner')).toBe('Restaurant');
    expect(profileToEffectiveRole('Driver')).toBe('Driver');
    expect(profileToEffectiveRole('Admin')).toBe('Admin');
    expect(profileToEffectiveRole('Collaborator')).toBe('Customer');
  });

  it('maps role to default profile correctly', () => {
    expect(roleToDefaultProfile('Customer')).toBe('Customer');
    expect(roleToDefaultProfile('Restaurant')).toBe('BusinessOwner');
    expect(roleToDefaultProfile('Driver')).toBe('Driver');
    expect(roleToDefaultProfile('Admin')).toBe('Admin');
  });

  it('returns appropriate default route for profile', () => {
    expect(getDefaultRouteForProfile('Customer')).toBe('/businesses');
    expect(getDefaultRouteForProfile('BusinessOwner')).toBe('/business/dashboard');
    expect(getDefaultRouteForProfile('Driver')).toBe('/driver/dashboard');
    expect(getDefaultRouteForProfile('Admin')).toBe('/admin/dashboard');
    expect(getDefaultRouteForProfile('Collaborator')).toBe('/community');
  });

  it('returns user-friendly display name for profiles', () => {
    expect(getProfileDisplayName('Customer')).toBe('Cliente');
    expect(getProfileDisplayName('BusinessOwner')).toBe('Negocio');
    expect(getProfileDisplayName('Driver')).toBe('Repartidor');
    expect(getProfileDisplayName('Admin')).toBe('Administrador');
    expect(getProfileDisplayName('Collaborator')).toBe('Colaborador');
  });

  it('verifies role helpers', () => {
    expect(isCustomerRole('Customer')).toBe(true);
    expect(isBusinessRole('Restaurant')).toBe(true);
    expect(isBusinessRole('BusinessOwner')).toBe(true);
    expect(isDriverRole('Driver')).toBe(true);
    expect(isAdminRole('Admin')).toBe(true);
    expect(isOpsRole('Restaurant')).toBe(true);
    expect(isOpsRole('Driver')).toBe(true);
    expect(isOpsRole('Customer')).toBe(false);
  });
});

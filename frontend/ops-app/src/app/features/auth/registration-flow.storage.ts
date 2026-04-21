export type OpsRegistrationType = 'restaurant' | 'driver';

export interface OpsRegistrationState {
  email: string;
  code: string;
  started: boolean;
  verified: boolean;
}

const STORAGE_PREFIX = 'iquitosDelivery.ops.registration';

export function getRegistrationState(type: OpsRegistrationType): OpsRegistrationState | null {
  try {
    const raw = sessionStorage.getItem(getStorageKey(type));
    return raw ? (JSON.parse(raw) as OpsRegistrationState) : null;
  } catch {
    return null;
  }
}

export function setRegistrationState(type: OpsRegistrationType, state: OpsRegistrationState): void {
  try {
    sessionStorage.setItem(getStorageKey(type), JSON.stringify(state));
  } catch {
    // Registration still works in-memory per page, but browser refresh recovery is unavailable.
  }
}

export function clearRegistrationState(type: OpsRegistrationType): void {
  try {
    sessionStorage.removeItem(getStorageKey(type));
  } catch {
    // Ignore restricted storage failures.
  }
}

function getStorageKey(type: OpsRegistrationType): string {
  return `${STORAGE_PREFIX}.${type}`;
}

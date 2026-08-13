export interface PlatformSettingsResponse {
  id: string;
  appName: string;
  tagline: string | null;
  logoUrl: string | null;
  appIconUrl: string | null;
  splashImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  legalEntityName: string | null;
  privacyEmail: string | null;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

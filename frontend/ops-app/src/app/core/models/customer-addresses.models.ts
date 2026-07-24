export interface CustomerAddressResponse {
  id: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  reference: string;
  zoneId: string;
  zoneName: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface UpsertCustomerAddressRequest {
  label: string;
  recipientName: string;
  recipientPhone: string;
  addressLine: string;
  reference: string;
  zoneId: string;
  latitude?: number | null;
  longitude?: number | null;
}

export type AdminStatusAction = 'approve' | 'reject' | 'suspend' | 'reactivate';

export interface PendingRestaurantResponse {
  id: string;
  name: string;
  ownerUserId: string;
  ownerFullName: string;
  email: string;
  phone: string;
  zoneId: string;
  zoneName: string;
  approvalStatus: string;
  isActive: boolean;
  createdAtUtc: string;
}

export interface AdminRestaurantListItemResponse {
  restaurantId: string;
  ownerUserId: string;
  ownerFullName: string;
  ownerEmail: string;
  name: string;
  address: string;
  zoneId: string;
  zoneName: string;
  approvalStatus: string;
  isActive: boolean;
  userStatus: string;
  createdAtUtc: string;
}

export interface AdminRestaurantDetailResponse {
  restaurantId: string;
  ownerUserId: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPhone: string;
  name: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
  zoneName: string;
  approvalStatus: string;
  isActive: boolean;
  userStatus: string;
  openTime: string;
  closeTime: string;
  logoUrl?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface AdminDriverListItemResponse {
  driverId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  plate: string;
  zoneId: string;
  zoneName: string;
  approvalStatus: string;
  isAvailable: boolean;
  userStatus: string;
  createdAtUtc: string;
}

export interface AdminDriverDetailResponse {
  driverId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  plate: string;
  zoneId: string;
  zoneName: string;
  approvalStatus: string;
  isAvailable: boolean;
  userStatus: string;
  identityDocumentUrl?: string | null;
  vehiclePhotoUrl?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface AdminRestaurantFilters {
  approvalStatus?: string;
  isActive?: boolean | null;
  userStatus?: string;
}

export interface AdminDriverFilters {
  approvalStatus?: string;
  isAvailable?: boolean | null;
  userStatus?: string;
}

export interface UpdateAdminEntityStatusRequest {
  action: AdminStatusAction;
}

import { BusinessOrderStatus } from './business.model';

export type VehicleType = 0 | 1 | 2;

export interface VehicleTypeOption {
  label: 'Motorcycle' | 'Mototaxi' | 'Bicycle';
  value: VehicleType;
}

export interface AvailableDriverOrderListItemResponse {
  id: string;
  restaurantId: string;
  restaurantName: string;
  zoneId: string;
  zoneName: string;
  deliveryAddress: string;
  deliveryReference: string;
  courierEarningAmount: number;
  total: number;
  paymentMethod: string;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  createdAtUtc: string;
  readyAtUtc?: string | null;
}

export interface DriverAssignedOrderListItemResponse {
  id: string;
  restaurantName: string;
  status: BusinessOrderStatus | string;
  courierEarningAmount: number;
  total: number;
  deliveryAddress: string;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  createdAtUtc: string;
  readyAtUtc?: string | null;
  pickedUpAtUtc?: string | null;
}

export interface PendingDriverResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  zoneId: string;
  zoneName: string;
  vehicleType: string;
  plate: string;
  approvalStatus: string;
  isAvailable: boolean;
  trustLevel: string;
  trustScore: number;
  completedDeliveriesCount: number;
  averageRating: number;
}

export interface UpdateDriverOrderStatusRequest {
  status: number;
}

export interface DriverAvailableOrderFilters {
  q?: string;
}

export interface DriverMyOrderFilters {
  q?: string;
  status?: BusinessOrderStatus | string;
}

export interface StartDriverRegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  plate: string;
  zoneId: string;
}

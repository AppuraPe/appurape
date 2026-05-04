import { OrderStatus } from './restaurant.models';

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
  total: number;
  paymentMethod: string;
  createdAtUtc: string;
  readyAtUtc?: string | null;
}

export interface DriverAssignedOrderListItemResponse {
  id: string;
  restaurantName: string;
  status: OrderStatus | string;
  total: number;
  deliveryAddress: string;
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
}

export interface UpdateDriverOrderStatusRequest {
  status: OrderStatus;
}

export interface DriverAvailableOrderFilters {
  q?: string;
}

export interface DriverMyOrderFilters {
  q?: string;
  status?: OrderStatus | string;
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

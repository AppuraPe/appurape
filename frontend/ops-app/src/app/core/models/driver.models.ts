import { BusinessOrderStatus } from './business.model';

export type VehicleType = 0 | 1 | 2;

export interface VehicleTypeOption {
  label: 'Motorcycle' | 'Mototaxi' | 'Bicycle';
  value: VehicleType;
}

export interface AvailableDriverOrderListItemResponse {
  id: string;
  orderCode: string;
  restaurantId: string;
  restaurantName: string;
  pickupAddress: string;
  zoneId: string;
  zoneName: string;
  customerName: string;
  status: BusinessOrderStatus | string;
  deliveryAddress: string;
  deliveryReference: string;
  courierEarningAmount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  createdAtUtc: string;
  readyAtUtc?: string | null;
}

export interface DriverAssignedOrderListItemResponse {
  id: string;
  orderCode: string;
  restaurantName: string;
  customerName: string;
  status: BusinessOrderStatus | string;
  courierEarningAmount: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  createdAtUtc: string;
  readyAtUtc?: string | null;
  pickedUpAtUtc?: string | null;
}

export interface DriverOrderDetailResponse {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  zoneId: string;
  zoneName: string;
  status: BusinessOrderStatus | string;
  deliveryAddress: string;
  deliveryReference: string;
  notes?: string | null;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  businessCommissionAmount: number;
  businessNetAmount: number;
  deliveryFee: number;
  deliveryPlatformCommissionAmount: number;
  courierEarningAmount: number;
  serviceFeeAmount: number;
  discountAmount: number;
  platformRevenueAmount: number;
  total: number;
  createdAtUtc: string;
  acceptedAtUtc?: string | null;
  readyAtUtc?: string | null;
  pickedUpAtUtc?: string | null;
  deliveredAtUtc?: string | null;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  items: Array<{
    productName: string;
    imageUrl?: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
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

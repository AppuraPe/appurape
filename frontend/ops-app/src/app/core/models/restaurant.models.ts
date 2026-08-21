export type OrderStatus =
  | 'Pending'
  | 'Accepted'
  | 'Preparing'
  | 'ReadyForPickup'
  | 'Assigned'
  | 'PickedUp'
  | 'OnTheWay'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus = 'Pending' | 'PendingConfirmation' | 'Paid' | 'Rejected' | 'Failed' | 'Refunded';

export interface MyRestaurantResponse {
  id: string;
  name: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
  zoneName: string;
  businessTypeId?: string | null;
  businessTypeCode?: string | null;
  businessTypeName?: string | null;
  openTime: string;
  closeTime: string;
  logoUrl?: string | null;
  hasOwnDelivery: boolean;
  ownDeliveryFee?: number | null;
  ownDeliveryNote?: string | null;
  isActive: boolean;
  approvalStatus: string;
  ownerUserId: string;
}

export interface UpdateMyRestaurantRequest {
  name: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
  openTime: string;
  closeTime: string;
  logoUrl?: string | null;
  hasOwnDelivery: boolean;
  ownDeliveryFee?: number | null;
  ownDeliveryNote?: string | null;
}

export interface StartRestaurantRegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  identityDocumentNumber: string;
  email: string;
  restaurantName: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
  businessTypeId?: string | null;
  openTime: string;
  closeTime: string;
}

export interface MenuCategoryResponse {
  id: string;
  restaurantId: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateMenuCategoryRequest {
  name: string;
  sortOrder: number;
}

export interface UpdateMenuCategoryRequest {
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuCategoryFilters {
  q?: string;
  isActive?: boolean | null;
}

export interface MenuItemResponse {
  id: string;
  restaurantId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  sku?: string | null;
  unitLabel?: string | null;
  trackStock: boolean;
  stockQuantity?: number | null;
  hasStock: boolean;
  isAvailable: boolean;
  isActive: boolean;
}

export interface CreateMenuItemRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  sku?: string | null;
  unitLabel?: string | null;
  trackStock?: boolean;
  stockQuantity?: number | null;
}

export interface UpdateMenuItemRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  sku?: string | null;
  unitLabel?: string | null;
  trackStock?: boolean;
  stockQuantity?: number | null;
  isAvailable: boolean;
  isActive: boolean;
}

export interface UpdateMenuItemAvailabilityRequest {
  isAvailable: boolean;
}

export interface MenuItemFilters {
  q?: string;
  categoryId?: string;
  isActive?: boolean | null;
  isAvailable?: boolean | null;
}

export interface RestaurantOrderListItemResponse {
  id: string;
  customerId: string;
  customerName: string;
  itemCount: number;
  status: OrderStatus | string;
  businessNetAmount: number;
  deliveryMode: string;
  platformRevenueAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus | string;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  createdAtUtc: string;
}

export interface RestaurantOrderDetailResponse {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus | string;
  deliveryAddress: string;
  deliveryReference: string;
  notes?: string | null;
  paymentMethod: string;
  paymentStatus: PaymentStatus | string;
  subtotal: number;
  businessCommissionAmount: number;
  businessNetAmount: number;
  deliveryMode: string;
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
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
}

export interface RestaurantOrderPaymentResponse {
  orderId: string;
  paymentId: string;
  method: string;
  status: PaymentStatus | string;
  amount: number;
  currency: string;
  manualReference?: string | null;
  confirmedAtUtc?: string | null;
  rejectedAtUtc?: string | null;
  failureReason?: string | null;
}

export interface ConfirmRestaurantOrderPaymentRequest {
  manualReference?: string | null;
}

export interface OrderCollaboratorPickupResponse {
  orderId: string;
  communityRequestId: string;
  status: string;
  totalAdditionalAmount: number;
}

export interface RejectRestaurantOrderPaymentRequest {
  failureReason: string;
}

export interface UpdateRestaurantOrderStatusRequest {
  status: number;
}

export interface RestaurantOrderFilters {
  q?: string;
  status?: OrderStatus | string;
}

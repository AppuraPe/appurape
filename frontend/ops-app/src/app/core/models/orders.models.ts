export interface OrderItemDetailResponse {
  productName: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CustomerOrderListItemResponse {
  id: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
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
  paymentMethod: string;
  assignedCourierUserId?: string | null;
  assignedCourierType?: string | null;
  createdAtUtc: string;
}

export interface CustomerOrderDetailResponse {
  id: string;
  restaurantId: string;
  restaurantName: string;
  status: string;
  deliveryAddress: string;
  deliveryReference: string;
  notes?: string | null;
  paymentMethod: string;
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
  driverRating?: number | null;
  driverFeedback?: string | null;
  items: OrderItemDetailResponse[];
}

export type CreateOrderResponse = CustomerOrderDetailResponse;

export type PaymentMethod = 'Cash' | 'Card' | 'Yape' | 'Plin';

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  restaurantId: string;
  zoneId: string;
  deliveryAddress: string;
  deliveryReference: string;
  notes?: string;
  paymentMethod: number;
  items: CreateOrderItemRequest[];
}

export interface RateDriverRequest {
  rating: number;
  comment?: string;
}

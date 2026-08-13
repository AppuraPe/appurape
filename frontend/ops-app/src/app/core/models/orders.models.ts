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
  deliveryMode: DeliveryMode | string;
  deliveryFee: number;
  deliveryMinimumAmount: number;
  deliveryPlatformCommissionAmount: number;
  courierEarningAmount: number;
  serviceFeeAmount: number;
  discountAmount: number;
  platformRevenueAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentFailureReason?: string | null;
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
  paymentStatus: string;
  paymentFailureReason?: string | null;
  subtotal: number;
  businessCommissionAmount: number;
  businessNetAmount: number;
  deliveryMode: DeliveryMode | string;
  deliveryFee: number;
  deliveryMinimumAmount: number;
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
export type DeliveryMode = 'PickupOrDirect' | 'BusinessDelivery' | 'VerifiedDriverDelivery' | 'CommunityCollaboratorDelivery';

export interface OrderFulfillmentOptionsResponse {
  orderId: string;
  currentDeliveryMode: DeliveryMode | string;
  canRequestDriver: boolean;
  canRequestCollaborator: boolean;
  unavailableReason?: string | null;
  linkedCommunityRequestId?: string | null;
}

export interface OrderCollaboratorPickupQuoteResponse {
  orderId: string;
  collaboratorEarningAmount: number;
  totalAdditionalAmount: number;
  deadlineUtc: string;
  quoteExpiresAtUtc: string;
  quoteToken: string;
}

export interface OrderCollaboratorPickupResponse {
  orderId: string;
  communityRequestId: string;
  status: string;
  totalAdditionalAmount: number;
}

export interface OrderDriverDeliveryResponse {
  orderId: string;
  deliveryMode: string;
  deliveryFee: number;
  total: number;
}

export interface CreateOrderItemRequest {
  menuItemId: string;
  quantity: number;
  clientUnitPrice?: number;
}

export interface CreateOrderRequest {
  clientRequestId: string;
  restaurantId: string;
  customerAddressId?: string;
  zoneId: string;
  deliveryAddress: string;
  deliveryReference: string;
  notes?: string;
  paymentMethod: number;
  deliveryMode?: number;
  offeredDeliveryAmount?: number;
  items: CreateOrderItemRequest[];
}

export interface ValidateOrderItemResponse {
  menuItemId: string;
  productName: string;
  requestedQuantity: number;
  validatedQuantity: number;
  clientUnitPrice?: number | null;
  currentUnitPrice: number;
  subtotal: number;
  exists: boolean;
  belongsToRestaurant: boolean;
  isActive: boolean;
  isAvailable: boolean;
  hasStock: boolean;
  quantityAdjusted: boolean;
  priceChanged: boolean;
  removed: boolean;
  message: string;
}

export interface ValidateOrderResponse {
  canCreateOrder: boolean;
  hasChanges: boolean;
  subtotal: number;
  businessCommissionAmount: number;
  businessNetAmount: number;
  deliveryMode: DeliveryMode | string;
  deliveryFee: number;
  deliveryMinimumAmount: number;
  deliveryPlatformCommissionAmount: number;
  courierEarningAmount: number;
  serviceFeeAmount: number;
  discountAmount: number;
  platformRevenueAmount: number;
  total: number;
  items: ValidateOrderItemResponse[];
}

export interface RateDriverRequest {
  rating: number;
  comment?: string;
}

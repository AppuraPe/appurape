export interface OrderItemDetailResponse {
  productName: string;
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
  deliveryFee: number;
  total: number;
  paymentMethod: string;
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
  deliveryFee: number;
  total: number;
  createdAtUtc: string;
  acceptedAtUtc?: string | null;
  readyAtUtc?: string | null;
  pickedUpAtUtc?: string | null;
  deliveredAtUtc?: string | null;
  items: OrderItemDetailResponse[];
}

export type CreateOrderResponse = CustomerOrderDetailResponse;

export type PaymentMethod = 'Cash' | 'Card' | 'Yape' | 'Plin' | string;

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
  paymentMethod: PaymentMethod;
  items: CreateOrderItemRequest[];
}

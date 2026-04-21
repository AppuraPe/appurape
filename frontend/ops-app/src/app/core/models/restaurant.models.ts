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

export interface MyRestaurantResponse {
  id: string;
  name: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
  zoneName: string;
  openTime: string;
  closeTime: string;
  logoUrl?: string | null;
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
}

export interface StartRestaurantRegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  restaurantName: string;
  description: string;
  address: string;
  reference: string;
  zoneId: string;
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

export interface MenuItemResponse {
  id: string;
  restaurantId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isActive: boolean;
}

export interface CreateMenuItemRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
}

export interface UpdateMenuItemRequest {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  isActive: boolean;
}

export interface UpdateMenuItemAvailabilityRequest {
  isAvailable: boolean;
}

export interface RestaurantOrderListItemResponse {
  id: string;
  customerId: string;
  customerName: string;
  status: OrderStatus | string;
  total: number;
  paymentMethod: string;
  createdAtUtc: string;
}

export interface UpdateRestaurantOrderStatusRequest {
  status: OrderStatus;
}

import type {
  ConfirmRestaurantOrderPaymentRequest,
  MenuCategoryFilters,
  MenuCategoryResponse,
  MenuItemFilters,
  MenuItemResponse,
  MyRestaurantResponse,
  OrderStatus,
  PaymentStatus,
  RejectRestaurantOrderPaymentRequest,
  RestaurantOrderFilters,
  RestaurantOrderDetailResponse,
  RestaurantOrderListItemResponse,
  RestaurantOrderPaymentResponse,
  StartRestaurantRegistrationRequest,
  UpdateMenuCategoryRequest,
  UpdateMenuItemAvailabilityRequest,
  UpdateMyRestaurantRequest,
  UpdateRestaurantOrderStatusRequest,
} from './restaurant.models';

export type MyBusinessResponse = MyRestaurantResponse;
export type UpdateMyBusinessRequest = UpdateMyRestaurantRequest;
export type StartBusinessRegistrationRequest = StartRestaurantRegistrationRequest;

export type CatalogCategoryResponse = MenuCategoryResponse;
export type CreateCatalogCategoryRequest = { name: string; sortOrder: number };
export type UpdateCatalogCategoryRequest = UpdateMenuCategoryRequest;
export type CatalogCategoryFilters = MenuCategoryFilters;

export type CatalogItemResponse = MenuItemResponse;
export type CatalogItemFilters = MenuItemFilters;
export type UpdateCatalogItemAvailabilityRequest = UpdateMenuItemAvailabilityRequest;

export type BusinessOrderStatus = OrderStatus;
export type BusinessPaymentStatus = PaymentStatus;
export type BusinessOrderDetailResponse = RestaurantOrderDetailResponse;
export type BusinessOrderListItemResponse = RestaurantOrderListItemResponse;
export type BusinessOrderPaymentResponse = RestaurantOrderPaymentResponse;
export type UpdateBusinessOrderStatusRequest = UpdateRestaurantOrderStatusRequest;
export type BusinessOrderFilters = RestaurantOrderFilters;
export type ConfirmBusinessOrderPaymentRequest = ConfirmRestaurantOrderPaymentRequest;
export type RejectBusinessOrderPaymentRequest = RejectRestaurantOrderPaymentRequest;

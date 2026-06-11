import type {
  MenuCategoryFilters,
  MenuCategoryResponse,
  MenuItemFilters,
  MenuItemResponse,
  MyRestaurantResponse,
  OrderStatus,
  RestaurantOrderFilters,
  RestaurantOrderListItemResponse,
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
export type BusinessOrderListItemResponse = RestaurantOrderListItemResponse;
export type UpdateBusinessOrderStatusRequest = UpdateRestaurantOrderStatusRequest;
export type BusinessOrderFilters = RestaurantOrderFilters;

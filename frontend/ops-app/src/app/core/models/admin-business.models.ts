import type {
  AdminRestaurantDetailResponse,
  AdminRestaurantFilters,
  AdminRestaurantListItemResponse,
  AdminStatusAction,
  PendingRestaurantResponse,
} from './admin.models';

export type PendingBusinessResponse = PendingRestaurantResponse;
export type AdminBusinessListItemResponse = AdminRestaurantListItemResponse;
export type AdminBusinessDetailResponse = AdminRestaurantDetailResponse;
export type AdminBusinessFilters = AdminRestaurantFilters;
export type UpdateAdminBusinessStatusAction = AdminStatusAction;
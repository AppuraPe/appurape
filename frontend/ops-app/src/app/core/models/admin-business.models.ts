import type {
  AdminBusinessTypeResponse,
  AdminRestaurantDetailResponse,
  AdminRestaurantFilters,
  AdminRestaurantListItemResponse,
  AdminStatusAction,
  PendingRestaurantResponse,
  UpdateAdminBusinessTypeRequest as UpdateAdminRestaurantBusinessTypeRequestModel,
  UpdateBusinessTypeStatusRequest,
  UpsertAdminBusinessTypeRequest,
} from './admin.models';

export type PendingBusinessResponse = PendingRestaurantResponse;
export type AdminBusinessListItemResponse = AdminRestaurantListItemResponse;
export type AdminBusinessDetailResponse = AdminRestaurantDetailResponse;
export type AdminBusinessFilters = AdminRestaurantFilters;
export type UpdateAdminBusinessStatusAction = AdminStatusAction;
export type AdminManagedBusinessTypeResponse = AdminBusinessTypeResponse;
export type UpdateManagedBusinessTypeStatusRequest = UpdateBusinessTypeStatusRequest;
export type UpsertManagedBusinessTypeRequest = UpsertAdminBusinessTypeRequest;
export type UpdateAdminBusinessTypeRequest = UpdateAdminRestaurantBusinessTypeRequestModel;

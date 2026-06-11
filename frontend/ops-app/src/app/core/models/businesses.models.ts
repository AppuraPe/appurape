import type {
  PublicMenuCategoryResponse,
  PublicMenuResponse,
  PublicSearchFoodItemResponse,
  PublicSearchResponse,
  PublicSearchRestaurantItemResponse,
  RestaurantDetailResponse,
  RestaurantListItemResponse,
  ZoneListItemResponse,
} from './restaurants.models';

export type BusinessListItemResponse = RestaurantListItemResponse;
export type BusinessDetailResponse = RestaurantDetailResponse;
export type CatalogResponse = PublicMenuResponse;
export type CatalogCategoryResponse = PublicMenuCategoryResponse;
export type BusinessZoneListItemResponse = ZoneListItemResponse;
export type PublicSearchBusinessItemResponse = PublicSearchRestaurantItemResponse;
export type PublicSearchCatalogItemResponse = PublicSearchFoodItemResponse;
export type PublicBusinessSearchResponse = PublicSearchResponse;

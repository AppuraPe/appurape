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

export interface BusinessTypeListItemResponse {
  id: string;
  code: string;
  name: string;
  slug: string;
  iconKey?: string | null;
  sortOrder: number;
  businessCount: number;
}

export interface BusinessCategorySectionResponse {
  category: BusinessTypeListItemResponse;
  totalBusinesses: number;
  businesses: BusinessListItemResponse[];
}

export interface PublicBusinessMobileHomeResponse {
  categories: BusinessTypeListItemResponse[];
  popularCategories: BusinessTypeListItemResponse[];
  sections: BusinessCategorySectionResponse[];
}

export interface BusinessBrowseFilters {
  q?: string;
  zoneId?: string;
  businessTypeId?: string;
  openNow?: boolean;
  sort?: 'alphabetical' | 'recent' | 'popular' | '';
  page?: number;
  pageSize?: number;
}

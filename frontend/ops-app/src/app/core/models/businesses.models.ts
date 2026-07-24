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

export interface PublicBusinessProductDetailResponse {
  id: string;
  businessId: string;
  businessName: string;
  businessTypeName: string;
  zoneName: string;
  businessLogoUrl?: string | null;
  businessIsActive: boolean;
  businessIsOpen: boolean;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  sku?: string | null;
  unitLabel?: string | null;
  trackStock: boolean;
  stockQuantity?: number | null;
  hasStock: boolean;
  isAvailable: boolean;
  isActive: boolean;
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

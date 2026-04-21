export interface RestaurantListItemResponse {
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
  isOpenNow: boolean;
}

export interface RestaurantDetailResponse {
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

export interface PublicMenuCategoryResponse {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemResponse[];
}

export interface PublicMenuResponse {
  restaurantId: string;
  restaurantName: string;
  categories: PublicMenuCategoryResponse[];
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BusinessBrowseFilters,
  BusinessDetailResponse,
  BusinessListItemResponse,
  CatalogResponse,
  PublicBusinessSearchResponse,
} from '../models/businesses.models';
import { BusinessesApiService } from './businesses-api.service';

@Injectable({ providedIn: 'root' })
export class RestaurantsApiService {
  private readonly businessesApi = inject(BusinessesApiService);

  getRestaurants(filters: BusinessBrowseFilters = {}): Observable<BusinessListItemResponse[]> {
    return this.businessesApi.getBusinesses(filters);
  }

  getRestaurant(id: string): Observable<BusinessDetailResponse> {
    return this.businessesApi.getBusiness(id);
  }

  getRestaurantMenu(id: string, q?: string): Observable<CatalogResponse> {
    return this.businessesApi.getBusinessCatalog(id, q);
  }

  searchPublic(q: string): Observable<PublicBusinessSearchResponse> {
    return this.businessesApi.searchPublic(q);
  }
}

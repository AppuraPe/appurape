import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PublicMenuResponse,
  RestaurantDetailResponse,
  RestaurantListItemResponse,
} from '../models/restaurants.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class RestaurantsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/restaurants');

  getRestaurants(): Observable<RestaurantListItemResponse[]> {
    return this.http.get<RestaurantListItemResponse[]>(this.baseUrl);
  }

  getRestaurant(id: string): Observable<RestaurantDetailResponse> {
    return this.http.get<RestaurantDetailResponse>(`${this.baseUrl}/${id}`);
  }

  getRestaurantMenu(id: string): Observable<PublicMenuResponse> {
    return this.http.get<PublicMenuResponse>(`${this.baseUrl}/${id}/menu`);
  }
}

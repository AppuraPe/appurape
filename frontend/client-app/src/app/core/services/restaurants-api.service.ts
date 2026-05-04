import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PublicSearchResponse,
  PublicMenuResponse,
  RestaurantDetailResponse,
  RestaurantListItemResponse,
} from '../models/restaurants.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class RestaurantsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/restaurants');
  private readonly searchUrl = buildApiUrl('/api/search');

  getRestaurants(q?: string, zoneId?: string): Observable<RestaurantListItemResponse[]> {
    const params = new URLSearchParams();

    if (q?.trim()) {
      params.set('q', q.trim());
    }

    if (zoneId?.trim()) {
      params.set('zoneId', zoneId.trim());
    }

    const queryString = params.toString();
    const requestUrl = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return this.http.get<RestaurantListItemResponse[]>(requestUrl);
  }

  getRestaurant(id: string): Observable<RestaurantDetailResponse> {
    return this.http.get<RestaurantDetailResponse>(`${this.baseUrl}/${id}`);
  }

  getRestaurantMenu(id: string, q?: string): Observable<PublicMenuResponse> {
    const trimmedQuery = q?.trim();
    const requestUrl = trimmedQuery
      ? `${this.baseUrl}/${id}/menu?q=${encodeURIComponent(trimmedQuery)}`
      : `${this.baseUrl}/${id}/menu`;

    return this.http.get<PublicMenuResponse>(requestUrl);
  }

  searchPublic(q: string): Observable<PublicSearchResponse> {
    const trimmedQuery = q.trim();
    const requestUrl = `${this.searchUrl}?q=${encodeURIComponent(trimmedQuery)}`;

    return this.http.get<PublicSearchResponse>(requestUrl);
  }
}

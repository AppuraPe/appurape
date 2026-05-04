import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RestaurantOrderFilters,
  RestaurantOrderListItemResponse,
  UpdateRestaurantOrderStatusRequest,
} from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class RestaurantOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/restaurant/orders`;

  getOrders(filters: RestaurantOrderFilters = {}): Observable<RestaurantOrderListItemResponse[]> {
    return this.http.get<RestaurantOrderListItemResponse[]>(this.baseUrl, {
      params: this.buildParams(filters),
    });
  }

  updateOrderStatus(id: string, request: UpdateRestaurantOrderStatusRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${id}/status`, request);
  }

  private buildParams(filters: RestaurantOrderFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return params;
  }
}

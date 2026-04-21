import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RestaurantOrderListItemResponse,
  UpdateRestaurantOrderStatusRequest,
} from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class RestaurantOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/restaurant/orders`;

  getOrders(): Observable<RestaurantOrderListItemResponse[]> {
    return this.http.get<RestaurantOrderListItemResponse[]>(this.baseUrl);
  }

  updateOrderStatus(id: string, request: UpdateRestaurantOrderStatusRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${id}/status`, request);
  }
}

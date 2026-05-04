import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailableDriverOrderListItemResponse,
  DriverAvailableOrderFilters,
  DriverAssignedOrderListItemResponse,
  DriverMyOrderFilters,
  UpdateDriverOrderStatusRequest,
} from '../models/driver.models';

@Injectable({ providedIn: 'root' })
export class DriverOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/driver/orders`;

  getAvailableOrders(filters: DriverAvailableOrderFilters = {}): Observable<AvailableDriverOrderListItemResponse[]> {
    return this.http.get<AvailableDriverOrderListItemResponse[]>(`${this.baseUrl}/available`, {
      params: this.buildAvailableParams(filters),
    });
  }

  getMyOrders(filters: DriverMyOrderFilters = {}): Observable<DriverAssignedOrderListItemResponse[]> {
    return this.http.get<DriverAssignedOrderListItemResponse[]>(`${this.baseUrl}/my`, {
      params: this.buildMyOrderParams(filters),
    });
  }

  takeOrder(id: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${id}/take`, {});
  }

  updateMyOrderStatus(id: string, request: UpdateDriverOrderStatusRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/my/${id}/status`, request);
  }

  private buildAvailableParams(filters: DriverAvailableOrderFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    return params;
  }

  private buildMyOrderParams(filters: DriverMyOrderFilters): HttpParams {
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

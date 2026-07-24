import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailableDriverOrderListItemResponse,
  DriverAvailableOrderFilters,
  DriverAssignedOrderListItemResponse,
  DriverOrderDetailResponse,
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

  getActiveOrder(): Observable<DriverOrderDetailResponse | null> {
    return this.http.get<DriverOrderDetailResponse | null>(`${this.baseUrl}/active`);
  }

  getAvailableOrderById(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.get<DriverOrderDetailResponse>(`${this.baseUrl}/available/${id}`);
  }

  getOrderById(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.get<DriverOrderDetailResponse>(`${this.baseUrl}/${id}`);
  }

  getMyOrderById(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.get<DriverOrderDetailResponse>(`${this.baseUrl}/my/${id}`);
  }

  takeOrder(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.patch<DriverOrderDetailResponse>(`${this.baseUrl}/${id}/take`, {});
  }

  acceptOrder(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.post<DriverOrderDetailResponse>(`${this.baseUrl}/${id}/accept`, {});
  }

  markPickedUp(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.post<DriverOrderDetailResponse>(`${this.baseUrl}/${id}/picked-up`, {});
  }

  markOnTheWay(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.post<DriverOrderDetailResponse>(`${this.baseUrl}/${id}/on-the-way`, {});
  }

  markDelivered(id: string): Observable<DriverOrderDetailResponse> {
    return this.http.post<DriverOrderDetailResponse>(`${this.baseUrl}/${id}/delivered`, {});
  }

  updateMyOrderStatus(id: string, request: UpdateDriverOrderStatusRequest): Observable<DriverOrderDetailResponse> {
    return this.http.patch<DriverOrderDetailResponse>(`${this.baseUrl}/my/${id}/status`, request);
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

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  CustomerOrderDetailResponse,
  CustomerOrderListItemResponse,
} from '../models/orders.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/orders');

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(this.baseUrl, request);
  }

  getMyOrders(): Observable<CustomerOrderListItemResponse[]> {
    return this.http.get<CustomerOrderListItemResponse[]>(`${this.baseUrl}/my`);
  }

  getMyOrder(id: string): Observable<CustomerOrderDetailResponse> {
    return this.http.get<CustomerOrderDetailResponse>(`${this.baseUrl}/my/${id}`);
  }
}

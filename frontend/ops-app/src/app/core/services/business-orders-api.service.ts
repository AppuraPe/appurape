import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessOrderDetailResponse,
  BusinessOrderFilters,
  BusinessOrderListItemResponse,
  BusinessOrderPaymentResponse,
  ConfirmBusinessOrderPaymentRequest,
  RejectBusinessOrderPaymentRequest,
  UpdateBusinessOrderStatusRequest,
} from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class BusinessOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/business/orders`;
  private readonly restaurantOrdersBaseUrl = `${environment.apiBaseUrl}/api/restaurant/orders`;

  getOrders(filters: BusinessOrderFilters = {}): Observable<BusinessOrderListItemResponse[]> {
    return this.http.get<BusinessOrderListItemResponse[]>(this.baseUrl, {
      params: this.buildParams(filters),
    });
  }

  getOrderById(id: string): Observable<BusinessOrderDetailResponse> {
    return this.http.get<BusinessOrderDetailResponse>(`${this.baseUrl}/${id}`);
  }

  updateOrderStatus(id: string, request: UpdateBusinessOrderStatusRequest): Observable<BusinessOrderDetailResponse> {
    return this.http.patch<BusinessOrderDetailResponse>(`${this.baseUrl}/${id}/status`, request);
  }

  getOrderPayment(orderId: string): Observable<BusinessOrderPaymentResponse> {
    return this.http.get<BusinessOrderPaymentResponse>(`${this.restaurantOrdersBaseUrl}/${orderId}/payment`);
  }

  confirmOrderPayment(orderId: string, request: ConfirmBusinessOrderPaymentRequest): Observable<BusinessOrderPaymentResponse> {
    return this.http.post<BusinessOrderPaymentResponse>(`${this.restaurantOrdersBaseUrl}/${orderId}/payment/confirm`, request);
  }

  rejectOrderPayment(orderId: string, request: RejectBusinessOrderPaymentRequest): Observable<BusinessOrderPaymentResponse> {
    return this.http.post<BusinessOrderPaymentResponse>(`${this.restaurantOrdersBaseUrl}/${orderId}/payment/reject`, request);
  }

  private buildParams(filters: BusinessOrderFilters): HttpParams {
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

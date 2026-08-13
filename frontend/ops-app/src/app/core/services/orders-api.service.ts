import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  CustomerOrderDetailResponse,
  CustomerOrderListItemResponse,
  RateDriverRequest,
  OrderFulfillmentOptionsResponse,
  OrderCollaboratorPickupQuoteResponse,
  OrderCollaboratorPickupResponse,
  OrderDriverDeliveryResponse,
  ValidateOrderResponse,
} from '../models/orders.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/orders');

  createOrder(request: CreateOrderRequest): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(this.baseUrl, request);
  }

  validateOrder(request: CreateOrderRequest): Observable<ValidateOrderResponse> {
    return this.http.post<ValidateOrderResponse>(`${this.baseUrl}/validate`, request);
  }

  getMyOrders(): Observable<CustomerOrderListItemResponse[]> {
    return this.http.get<CustomerOrderListItemResponse[]>(`${this.baseUrl}/my`);
  }

  getMyOrder(id: string): Observable<CustomerOrderDetailResponse> {
    return this.http.get<CustomerOrderDetailResponse>(`${this.baseUrl}/my/${id}`);
  }

  getFulfillmentOptions(id: string): Observable<OrderFulfillmentOptionsResponse> {
    return this.http.get<OrderFulfillmentOptionsResponse>(`${this.baseUrl}/my/${id}/fulfillment-options`);
  }

  quoteCollaboratorPickup(id: string, compensationAmount: number, deadlineUtc?: string | null): Observable<OrderCollaboratorPickupQuoteResponse> {
    return this.http.post<OrderCollaboratorPickupQuoteResponse>(`${this.baseUrl}/my/${id}/collaborator-pickup/quote`, { compensationAmount, deadlineUtc });
  }

  createCollaboratorPickup(id: string, quoteToken: string): Observable<OrderCollaboratorPickupResponse> {
    return this.http.post<OrderCollaboratorPickupResponse>(`${this.baseUrl}/my/${id}/collaborator-pickup`, { quoteToken });
  }

  requestDriverDelivery(id: string, offeredDeliveryAmount?: number | null): Observable<OrderDriverDeliveryResponse> {
    return this.http.post<OrderDriverDeliveryResponse>(`${this.baseUrl}/my/${id}/driver-delivery`, { offeredDeliveryAmount });
  }

  rateDriver(id: string, request: RateDriverRequest): Observable<CustomerOrderDetailResponse> {
    return this.http.patch<CustomerOrderDetailResponse>(`${this.baseUrl}/my/${id}/driver-rating`, request);
  }
}

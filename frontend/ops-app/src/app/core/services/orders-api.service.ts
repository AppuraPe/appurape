import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  OrderDeliveryConfirmationResponse,
  ValidateOrderResponse,
  PaymentEvidenceResponse,
  RefundResponse,
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

  quoteCollaboratorPickup(id: string, compensationAmount: number, customerAddressId: string, deadlineUtc?: string | null): Observable<OrderCollaboratorPickupQuoteResponse> {
    return this.http.post<OrderCollaboratorPickupQuoteResponse>(`${this.baseUrl}/my/${id}/collaborator-pickup/quote`, { compensationAmount, customerAddressId, deadlineUtc });
  }

  createCollaboratorPickup(id: string, quoteToken: string): Observable<OrderCollaboratorPickupResponse> {
    return this.http.post<OrderCollaboratorPickupResponse>(`${this.baseUrl}/my/${id}/collaborator-pickup`, { quoteToken });
  }

  requestDriverDelivery(id: string, customerAddressId: string, offeredDeliveryAmount?: number | null): Observable<OrderDriverDeliveryResponse> {
    return this.http.post<OrderDriverDeliveryResponse>(`${this.baseUrl}/my/${id}/driver-delivery`, { customerAddressId, offeredDeliveryAmount });
  }

  getDeliveryConfirmation(id: string): Observable<OrderDeliveryConfirmationResponse> {
    return this.http.get<OrderDeliveryConfirmationResponse>(`${this.baseUrl}/my/${id}/delivery-confirmation`);
  }

  regenerateDeliveryConfirmation(id: string): Observable<OrderDeliveryConfirmationResponse> {
    return this.http.post<OrderDeliveryConfirmationResponse>(`${this.baseUrl}/my/${id}/delivery-confirmation/regenerate`, {});
  }

  cancelOrder(id: string, reason?: string): Observable<CustomerOrderDetailResponse> {
    return this.http.post<CustomerOrderDetailResponse>(`${this.baseUrl}/my/${id}/cancel`, { reason });
  }

  rateDriver(id: string, request: RateDriverRequest): Observable<CustomerOrderDetailResponse> {
    return this.http.patch<CustomerOrderDetailResponse>(`${this.baseUrl}/my/${id}/driver-rating`, request);
  }

  submitPaymentEvidence(id: string, operationNumber: string, paidAtUtc: string, amount: number, file: File): Observable<PaymentEvidenceResponse> {
    const form = new FormData();
    form.append('operationNumber', operationNumber);
    form.append('declaredAmount', amount.toFixed(2));
    form.append('paidAtUtc', paidAtUtc);
    form.append('file', file, file.name);
    return this.http.post<PaymentEvidenceResponse>(`${this.baseUrl}/${id}/payment-evidence`, form, {
      headers: new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() }),
    });
  }

  getRefund(id: string): Observable<RefundResponse> {
    return this.http.get<RefundResponse>(`${this.baseUrl}/${id}/refund`);
  }

  downloadRefundEvidence(evidenceId: string): Observable<Blob> {
    return this.http.get(buildApiUrl(`/api/refund-evidence/${evidenceId}/file`), { responseType: 'blob' });
  }

  confirmRefund(refundId: string): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(buildApiUrl(`/api/refunds/${refundId}/customer-confirm`), {}, { headers: this.idempotencyHeaders() });
  }

  disputeRefund(refundId: string, reason: string): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(buildApiUrl(`/api/refunds/${refundId}/customer-dispute`), { reason }, { headers: this.idempotencyHeaders() });
  }

  private idempotencyHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}

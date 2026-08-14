import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessOrderDetailResponse,
  BusinessOrderFilters,
  BusinessOrderListItemResponse,
  BusinessOrderPaymentResponse,
  ConfirmBusinessOrderPaymentRequest,
  RejectBusinessOrderPaymentRequest,
  OrderCollaboratorPickupResponse,
  UpdateBusinessOrderStatusRequest,
} from '../models/business.model';
import { PaymentEvidenceResponse, RefundResponse } from '../models/orders.models';

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
    return this.http.post<BusinessOrderPaymentResponse>(`${this.restaurantOrdersBaseUrl}/${orderId}/payment/confirm`, request, { headers: this.idempotencyHeaders() });
  }

  rejectOrderPayment(orderId: string, request: RejectBusinessOrderPaymentRequest): Observable<BusinessOrderPaymentResponse> {
    return this.http.post<BusinessOrderPaymentResponse>(`${this.restaurantOrdersBaseUrl}/${orderId}/payment/reject`, request, { headers: this.idempotencyHeaders() });
  }

  openPaymentReview(paymentId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/api/payments/${paymentId}/open-review`, { reason }, { headers: this.idempotencyHeaders() });
  }

  getPaymentEvidence(orderId: string): Observable<PaymentEvidenceResponse> {
    return this.http.get<PaymentEvidenceResponse>(`${this.baseUrl}/${orderId}/payment-evidence`);
  }

  downloadPaymentEvidence(evidenceId: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/api/payment-evidence/${evidenceId}/file`, { responseType: 'blob' });
  }

  getRefund(orderId: string): Observable<RefundResponse> {
    return this.http.get<RefundResponse>(`${environment.apiBaseUrl}/api/orders/${orderId}/refund`);
  }

  submitRefundEvidence(refundId: string, operationNumber: string, amount: number, refundedAtUtc: string, file: File): Observable<RefundResponse> {
    const form = new FormData();
    form.append('operationNumber', operationNumber);
    form.append('amount', amount.toFixed(2));
    form.append('refundedAtUtc', refundedAtUtc);
    form.append('file', file, file.name);
    return this.http.post<RefundResponse>(`${environment.apiBaseUrl}/api/refunds/${refundId}/business-evidence`, form, { headers: this.idempotencyHeaders() });
  }

  confirmCollaboratorPickup(orderId: string, pickupCode: string): Observable<OrderCollaboratorPickupResponse> {
    return this.http.post<OrderCollaboratorPickupResponse>(`${this.restaurantOrdersBaseUrl}/${orderId}/collaborator-pickup/confirm`, { pickupCode });
  }

  dispatchBusinessDelivery(orderId: string): Observable<BusinessOrderDetailResponse> {
    return this.http.post<BusinessOrderDetailResponse>(`${this.baseUrl}/${orderId}/dispatch`, {});
  }

  confirmBusinessDelivery(orderId: string, confirmationCode: string): Observable<BusinessOrderDetailResponse> {
    return this.http.post<BusinessOrderDetailResponse>(`${this.baseUrl}/${orderId}/confirm-delivery`, { confirmationCode });
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

  private idempotencyHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}

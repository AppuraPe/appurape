import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminPaymentDetail, AdminPaymentListItem } from '../models/admin-payments.models';

@Injectable({ providedIn: 'root' })
export class AdminPaymentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/payments`;

  getPendingPayments(): Observable<AdminPaymentListItem[]> {
    return this.http.get<AdminPaymentListItem[]>(`${this.baseUrl}/pending`);
  }

  getPaymentDetail(orderId: string): Observable<AdminPaymentDetail> {
    return this.http.get<AdminPaymentDetail>(`${this.baseUrl}/${orderId}`);
  }

  downloadPaymentProof(relativePath: string): Observable<Blob> {
    const url = relativePath.startsWith('http') ? relativePath : `${environment.apiBaseUrl}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  confirmPayment(orderId: string): Observable<AdminPaymentDetail> {
    return this.http.post<AdminPaymentDetail>(`${this.baseUrl}/${orderId}/confirm`, {}, { headers: this.idempotencyHeaders() });
  }

  rejectPayment(orderId: string): Observable<AdminPaymentDetail> {
    return this.http.post<AdminPaymentDetail>(`${this.baseUrl}/${orderId}/reject`, {}, { headers: this.idempotencyHeaders() });
  }

  resolveReview(orderId: string, confirm: boolean, reason: string): Observable<AdminPaymentDetail> {
    return this.http.post<AdminPaymentDetail>(`${this.baseUrl}/${orderId}/resolve-review`, { confirm, reason }, { headers: this.idempotencyHeaders() });
  }

  regenerateDeliveryCode(orderId: string, reason: string): Observable<{ orderId: string; expiresAtUtc: string; regenerated: boolean }> {
    return this.http.post<{ orderId: string; expiresAtUtc: string; regenerated: boolean }>(`${environment.apiBaseUrl}/api/admin/orders/${orderId}/delivery-confirmation/regenerate`, { reason });
  }

  private idempotencyHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}

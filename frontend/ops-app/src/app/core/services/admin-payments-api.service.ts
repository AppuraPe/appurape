import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  confirmPayment(orderId: string): Observable<AdminPaymentDetail> {
    return this.http.post<AdminPaymentDetail>(`${this.baseUrl}/${orderId}/confirm`, {});
  }

  rejectPayment(orderId: string): Observable<AdminPaymentDetail> {
    return this.http.post<AdminPaymentDetail>(`${this.baseUrl}/${orderId}/reject`, {});
  }

  regenerateDeliveryCode(orderId: string, reason: string): Observable<{ orderId: string; expiresAtUtc: string; regenerated: boolean }> {
    return this.http.post<{ orderId: string; expiresAtUtc: string; regenerated: boolean }>(`${environment.apiBaseUrl}/api/admin/orders/${orderId}/delivery-confirmation/regenerate`, { reason });
  }
}

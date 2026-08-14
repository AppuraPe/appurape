import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminCommissionSummary,
  CollaboratorVerification,
  CreateSettlementBatchRequest,
  FinancialMovement,
  FinancialObligation,
  LegacyMovement,
  RejectCollaboratorVerificationRequest,
  SettlementBatch,
} from '../models/admin-finance.models';
import { RefundResponse } from '../models/orders.models';

@Injectable({ providedIn: 'root' })
export class AdminFinanceApiService {
  private readonly http = inject(HttpClient);
  private readonly commissionsUrl = `${environment.apiBaseUrl}/api/admin/commissions`;
  private readonly settlementsUrl = `${environment.apiBaseUrl}/api/admin/settlements`;
  private readonly verificationsUrl = `${environment.apiBaseUrl}/api/admin/collaborator-verifications`;

  getCommissionSummary(): Observable<AdminCommissionSummary> {
    return this.http.get<AdminCommissionSummary>(`${this.commissionsUrl}/summary`);
  }

  getFinancialMovements(filters: { status?: string; type?: string } = {}): Observable<FinancialMovement[]> {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<FinancialMovement[]>(`${this.commissionsUrl}/movements`, { params });
  }

  waiveMovement(movementId: string): Observable<FinancialMovement> {
    return this.http.post<FinancialMovement>(`${this.commissionsUrl}/movements/${movementId}/waive`, {});
  }

  getSettlements(): Observable<SettlementBatch[]> {
    return this.http.get<SettlementBatch[]>(this.settlementsUrl);
  }

  getSettlement(settlementId: string): Observable<SettlementBatch> {
    return this.http.get<SettlementBatch>(`${this.settlementsUrl}/${settlementId}`);
  }

  createSettlement(request: CreateSettlementBatchRequest): Observable<SettlementBatch> {
    return this.http.post<SettlementBatch>(this.settlementsUrl, request, { headers: this.idempotencyHeaders() });
  }

  getFinancialObligations(): Observable<FinancialObligation[]> {
    return this.http.get<FinancialObligation[]>(`${environment.apiBaseUrl}/api/admin/financial-obligations`);
  }

  getLegacyReconciliation(): Observable<LegacyMovement[]> {
    return this.http.get<LegacyMovement[]>(`${environment.apiBaseUrl}/api/admin/finance/reconciliation`);
  }

  getDisputedRefunds(): Observable<RefundResponse[]> {
    return this.http.get<RefundResponse[]>(`${environment.apiBaseUrl}/api/admin/refunds`);
  }

  resolveRefund(id: string, complete: boolean, reason: string): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(`${environment.apiBaseUrl}/api/admin/refunds/${id}/resolve`, { complete, reason }, { headers: this.idempotencyHeaders() });
  }

  reconcileLegacyMovement(id: string, decision: string, reason: string): Observable<LegacyMovement> {
    return this.http.post<LegacyMovement>(`${environment.apiBaseUrl}/api/admin/finance/reconciliation/${id}`, { decision, reason }, { headers: this.idempotencyHeaders() });
  }

  approveSettlement(settlementId: string): Observable<SettlementBatch> {
    return this.http.post<SettlementBatch>(`${this.settlementsUrl}/${settlementId}/approve`, {}, { headers: this.idempotencyHeaders() });
  }

  reportSettlementPayment(settlementId: string, operationNumber: string, amount: number, paidAtUtc: string, file: File): Observable<SettlementBatch> {
    const form = new FormData();
    form.append('operationNumber', operationNumber);
    form.append('amount', String(amount));
    form.append('paidAtUtc', paidAtUtc);
    form.append('file', file);
    return this.http.post<SettlementBatch>(`${this.settlementsUrl}/${settlementId}/report-payment`, form, { headers: this.idempotencyHeaders() });
  }

  downloadSettlementPaymentEvidence(settlementId: string): Observable<Blob> {
    return this.http.get(`${this.settlementsUrl}/${settlementId}/payment-evidence`, { responseType: 'blob' });
  }

  markSettlementPaid(settlementId: string): Observable<SettlementBatch> {
    return this.http.post<SettlementBatch>(`${this.settlementsUrl}/${settlementId}/mark-paid`, {}, { headers: this.idempotencyHeaders() });
  }

  cancelSettlement(settlementId: string): Observable<SettlementBatch> {
    return this.http.post<SettlementBatch>(`${this.settlementsUrl}/${settlementId}/cancel`, {}, { headers: this.idempotencyHeaders() });
  }

  getPendingCollaboratorVerifications(): Observable<CollaboratorVerification[]> {
    return this.http.get<CollaboratorVerification[]>(this.verificationsUrl);
  }

  approveCollaboratorVerification(verificationId: string): Observable<CollaboratorVerification> {
    return this.http.post<CollaboratorVerification>(`${this.verificationsUrl}/${verificationId}/approve`, {});
  }

  rejectCollaboratorVerification(
    verificationId: string,
    request: RejectCollaboratorVerificationRequest,
  ): Observable<CollaboratorVerification> {
    return this.http.post<CollaboratorVerification>(`${this.verificationsUrl}/${verificationId}/reject`, request);
  }

  getCollaboratorEvidence(verificationId: string, type: 'dni' | 'selfie'): Observable<Blob> {
    return this.http.get(`${this.verificationsUrl}/${verificationId}/evidence/${type}`, { responseType: 'blob' });
  }

  private idempotencyHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
  }
}

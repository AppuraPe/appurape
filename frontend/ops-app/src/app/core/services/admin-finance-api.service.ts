import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminCommissionSummary,
  CollaboratorVerification,
  CreateSettlementBatchRequest,
  FinancialMovement,
  RejectCollaboratorVerificationRequest,
  SettlementBatch,
} from '../models/admin-finance.models';

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
    return this.http.post<SettlementBatch>(this.settlementsUrl, request);
  }

  markSettlementPaid(settlementId: string): Observable<SettlementBatch> {
    return this.http.post<SettlementBatch>(`${this.settlementsUrl}/${settlementId}/mark-paid`, {});
  }

  cancelSettlement(settlementId: string): Observable<SettlementBatch> {
    return this.http.post<SettlementBatch>(`${this.settlementsUrl}/${settlementId}/cancel`, {});
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
}

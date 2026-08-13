import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccountDeletionStatus, LegalConsentStatus, LegalDocument } from '../models/legal.models';

@Injectable({ providedIn: 'root' })
export class LegalApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;
  readonly consentStatus = signal<LegalConsentStatus | null>(null);
  getActive(role: string): Observable<LegalDocument[]> { return this.http.get<LegalDocument[]>(`${this.baseUrl}/legal/documents/active`, { params: { role } }); }
  getDocument(slug: string): Observable<LegalDocument> { return this.http.get<LegalDocument>(`${this.baseUrl}/legal/documents/${slug}`); }
  getConsentStatus(): Observable<LegalConsentStatus> { return this.http.get<LegalConsentStatus>(`${this.baseUrl}/legal/consent-status`).pipe(tap(x => this.consentStatus.set(x))); }
  accept(documentIds: string[], platform: string, appVersion?: string | null): Observable<LegalConsentStatus> { return this.http.post<LegalConsentStatus>(`${this.baseUrl}/legal/acceptances`, { documentIds, platform, appVersion }).pipe(tap(x => this.consentStatus.set(x))); }
  getAllAdmin(): Observable<LegalDocument[]> { return this.http.get<LegalDocument[]>(`${this.baseUrl}/admin/legal`); }
  createDraft(request: Partial<LegalDocument>): Observable<LegalDocument> { return this.http.post<LegalDocument>(`${this.baseUrl}/admin/legal`, request); }
  publish(id: string): Observable<LegalDocument> { return this.http.post<LegalDocument>(`${this.baseUrl}/admin/legal/${id}/publish`, {}); }
  startDeletion(email: string): Observable<unknown> { return this.http.post(`${this.baseUrl}/account/deletion/start`, { email }); }
  confirmDeletion(email: string, code: string): Observable<AccountDeletionStatus> { return this.http.post<AccountDeletionStatus>(`${this.baseUrl}/account/deletion/confirm`, { email, code }); }
  deletionStatus(): Observable<AccountDeletionStatus> { return this.http.get<AccountDeletionStatus>(`${this.baseUrl}/account/deletion/status`); }
  cancelDeletion(): Observable<AccountDeletionStatus> { return this.http.post<AccountDeletionStatus>(`${this.baseUrl}/account/deletion/cancel`, {}); }
  startDeletionCancellation(email: string): Observable<unknown> { return this.http.post(`${this.baseUrl}/account/deletion/cancel/start`, { email }); }
  confirmDeletionCancellation(email: string, code: string): Observable<AccountDeletionStatus> { return this.http.post<AccountDeletionStatus>(`${this.baseUrl}/account/deletion/cancel/confirm`, { email, code }); }
}

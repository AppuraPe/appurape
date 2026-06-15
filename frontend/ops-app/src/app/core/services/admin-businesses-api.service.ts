import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminBusinessDetailResponse,
  AdminBusinessFilters,
  AdminBusinessListItemResponse,
  PendingBusinessResponse,
  UpdateAdminBusinessTypeRequest,
  UpdateAdminBusinessStatusAction,
} from '../models/admin-business.models';

@Injectable({ providedIn: 'root' })
export class AdminBusinessesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/businesses`;

  getBusinesses(filters: AdminBusinessFilters = {}): Observable<AdminBusinessListItemResponse[]> {
    return this.http.get<AdminBusinessListItemResponse[]>(this.baseUrl, {
      params: this.buildParams(filters),
    });
  }

  getBusinessById(id: string): Observable<AdminBusinessDetailResponse> {
    return this.http.get<AdminBusinessDetailResponse>(`${this.baseUrl}/${id}`);
  }

  updateBusinessStatus(id: string, action: UpdateAdminBusinessStatusAction): Observable<AdminBusinessDetailResponse> {
    return this.http.patch<AdminBusinessDetailResponse>(`${this.baseUrl}/${id}/status`, { action });
  }

  updateBusinessType(id: string, request: UpdateAdminBusinessTypeRequest): Observable<AdminBusinessDetailResponse> {
    return this.http.patch<AdminBusinessDetailResponse>(`${this.baseUrl}/${id}/business-type`, request);
  }

  getPendingBusinesses(): Observable<PendingBusinessResponse[]> {
    return this.http.get<PendingBusinessResponse[]>(`${this.baseUrl}/pending`);
  }

  approveBusiness(id: string): Observable<PendingBusinessResponse> {
    return this.http.patch<PendingBusinessResponse>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectBusiness(id: string): Observable<PendingBusinessResponse> {
    return this.http.patch<PendingBusinessResponse>(`${this.baseUrl}/${id}/reject`, {});
  }

  private buildParams(filters: AdminBusinessFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.approvalStatus) {
      params = params.set('approvalStatus', filters.approvalStatus);
    }

    if (filters.isActive !== undefined && filters.isActive !== null) {
      params = params.set('isActive', String(filters.isActive));
    }

    if (filters.userStatus) {
      params = params.set('status', filters.userStatus);
    }

    return params;
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminBusinessTypeResponse,
  AdminDriverDetailResponse,
  AdminDriverFilters,
  AdminDriverListItemResponse,
  AdminRestaurantDetailResponse,
  AdminRestaurantFilters,
  AdminRestaurantListItemResponse,
  AdminStatusAction,
  PendingRestaurantResponse,
  UpdateBusinessTypeStatusRequest,
  UpsertAdminBusinessTypeRequest,
} from '../models/admin.models';
import { PendingDriverResponse } from '../models/driver.models';
import { AdminBusinessesApiService } from './admin-businesses-api.service';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly adminBusinessesApi = inject(AdminBusinessesApiService);
  private readonly businessTypesBaseUrl = `${environment.apiBaseUrl}/api/admin/business-types`;
  private readonly driversBaseUrl = `${environment.apiBaseUrl}/api/admin/drivers`;

  getRestaurants(filters: AdminRestaurantFilters = {}): Observable<AdminRestaurantListItemResponse[]> {
    return this.adminBusinessesApi.getBusinesses(filters);
  }

  getRestaurantById(id: string): Observable<AdminRestaurantDetailResponse> {
    return this.adminBusinessesApi.getBusinessById(id);
  }

  updateRestaurantStatus(id: string, action: AdminStatusAction): Observable<AdminRestaurantDetailResponse> {
    return this.adminBusinessesApi.updateBusinessStatus(id, action);
  }

  getPendingRestaurants(): Observable<PendingRestaurantResponse[]> {
    return this.adminBusinessesApi.getPendingBusinesses();
  }

  approveRestaurant(id: string): Observable<PendingRestaurantResponse> {
    return this.adminBusinessesApi.approveBusiness(id);
  }

  rejectRestaurant(id: string): Observable<PendingRestaurantResponse> {
    return this.adminBusinessesApi.rejectBusiness(id);
  }

  getBusinessTypes(): Observable<AdminBusinessTypeResponse[]> {
    return this.http.get<AdminBusinessTypeResponse[]>(this.businessTypesBaseUrl);
  }

  createBusinessType(request: UpsertAdminBusinessTypeRequest): Observable<AdminBusinessTypeResponse> {
    return this.http.post<AdminBusinessTypeResponse>(this.businessTypesBaseUrl, request);
  }

  updateBusinessType(id: string, request: UpsertAdminBusinessTypeRequest): Observable<AdminBusinessTypeResponse> {
    return this.http.put<AdminBusinessTypeResponse>(`${this.businessTypesBaseUrl}/${id}`, request);
  }

  updateBusinessTypeStatus(id: string, request: UpdateBusinessTypeStatusRequest): Observable<AdminBusinessTypeResponse> {
    return this.http.patch<AdminBusinessTypeResponse>(`${this.businessTypesBaseUrl}/${id}/status`, request);
  }

  getDrivers(filters: AdminDriverFilters = {}): Observable<AdminDriverListItemResponse[]> {
    return this.http.get<AdminDriverListItemResponse[]>(this.driversBaseUrl, {
      params: this.buildDriverParams(filters),
    });
  }

  getDriverById(id: string): Observable<AdminDriverDetailResponse> {
    return this.http.get<AdminDriverDetailResponse>(`${this.driversBaseUrl}/${id}`);
  }

  updateDriverStatus(id: string, action: AdminStatusAction): Observable<AdminDriverDetailResponse> {
    return this.http.patch<AdminDriverDetailResponse>(`${this.driversBaseUrl}/${id}/status`, { action });
  }

  getPendingDrivers(): Observable<PendingDriverResponse[]> {
    return this.http.get<PendingDriverResponse[]>(`${this.driversBaseUrl}/pending`);
  }

  approveDriver(id: string): Observable<PendingDriverResponse> {
    return this.http.patch<PendingDriverResponse>(`${this.driversBaseUrl}/${id}/approve`, {});
  }

  rejectDriver(id: string): Observable<PendingDriverResponse> {
    return this.http.patch<PendingDriverResponse>(`${this.driversBaseUrl}/${id}/reject`, {});
  }

  private buildDriverParams(filters: AdminDriverFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.approvalStatus) {
      params = params.set('approvalStatus', filters.approvalStatus);
    }

    if (filters.isAvailable !== undefined && filters.isAvailable !== null) {
      params = params.set('isAvailable', String(filters.isAvailable));
    }

    if (filters.userStatus) {
      params = params.set('status', filters.userStatus);
    }

    return params;
  }
}

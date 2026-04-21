import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDriverDetailResponse,
  AdminDriverFilters,
  AdminDriverListItemResponse,
  AdminRestaurantDetailResponse,
  AdminRestaurantFilters,
  AdminRestaurantListItemResponse,
  AdminStatusAction,
  PendingRestaurantResponse,
} from '../models/admin.models';
import { PendingDriverResponse } from '../models/driver.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly restaurantsBaseUrl = `${environment.apiBaseUrl}/api/admin/restaurants`;
  private readonly driversBaseUrl = `${environment.apiBaseUrl}/api/admin/drivers`;

  getRestaurants(filters: AdminRestaurantFilters = {}): Observable<AdminRestaurantListItemResponse[]> {
    return this.http.get<AdminRestaurantListItemResponse[]>(this.restaurantsBaseUrl, {
      params: this.buildRestaurantParams(filters),
    });
  }

  getRestaurantById(id: string): Observable<AdminRestaurantDetailResponse> {
    return this.http.get<AdminRestaurantDetailResponse>(`${this.restaurantsBaseUrl}/${id}`);
  }

  updateRestaurantStatus(id: string, action: AdminStatusAction): Observable<AdminRestaurantDetailResponse> {
    return this.http.patch<AdminRestaurantDetailResponse>(`${this.restaurantsBaseUrl}/${id}/status`, { action });
  }

  getPendingRestaurants(): Observable<PendingRestaurantResponse[]> {
    return this.http.get<PendingRestaurantResponse[]>(`${this.restaurantsBaseUrl}/pending`);
  }

  approveRestaurant(id: string): Observable<PendingRestaurantResponse> {
    return this.http.patch<PendingRestaurantResponse>(`${this.restaurantsBaseUrl}/${id}/approve`, {});
  }

  rejectRestaurant(id: string): Observable<PendingRestaurantResponse> {
    return this.http.patch<PendingRestaurantResponse>(`${this.restaurantsBaseUrl}/${id}/reject`, {});
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

  private buildRestaurantParams(filters: AdminRestaurantFilters): HttpParams {
    let params = new HttpParams();

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

  private buildDriverParams(filters: AdminDriverFilters): HttpParams {
    let params = new HttpParams();

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

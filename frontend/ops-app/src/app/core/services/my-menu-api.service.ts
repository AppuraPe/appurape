import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  MenuCategoryFilters,
  MenuCategoryResponse,
  MenuItemFilters,
  MenuItemResponse,
  UpdateMenuCategoryRequest,
  UpdateMenuItemAvailabilityRequest,
  UpdateMenuItemRequest,
} from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class MyMenuApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/my/menu`;

  getCategories(filters: MenuCategoryFilters = {}): Observable<MenuCategoryResponse[]> {
    return this.http.get<MenuCategoryResponse[]>(`${this.baseUrl}/categories`, {
      params: this.buildCategoryParams(filters),
    });
  }

  createCategory(request: CreateMenuCategoryRequest): Observable<MenuCategoryResponse> {
    return this.http.post<MenuCategoryResponse>(`${this.baseUrl}/categories`, request);
  }

  updateCategory(id: string, request: UpdateMenuCategoryRequest): Observable<MenuCategoryResponse> {
    return this.http.put<MenuCategoryResponse>(`${this.baseUrl}/categories/${id}`, request);
  }

  getItems(filters: MenuItemFilters = {}): Observable<MenuItemResponse[]> {
    return this.http.get<MenuItemResponse[]>(`${this.baseUrl}/items`, {
      params: this.buildItemParams(filters),
    });
  }

  createItem(request: CreateMenuItemRequest): Observable<MenuItemResponse> {
    return this.http.post<MenuItemResponse>(`${this.baseUrl}/items`, request);
  }

  updateItem(id: string, request: UpdateMenuItemRequest): Observable<MenuItemResponse> {
    return this.http.put<MenuItemResponse>(`${this.baseUrl}/items/${id}`, request);
  }

  updateItemAvailability(id: string, request: UpdateMenuItemAvailabilityRequest): Observable<MenuItemResponse> {
    return this.http.patch<MenuItemResponse>(`${this.baseUrl}/items/${id}/availability`, request);
  }

  private buildCategoryParams(filters: MenuCategoryFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.isActive !== undefined && filters.isActive !== null) {
      params = params.set('isActive', String(filters.isActive));
    }

    return params;
  }

  private buildItemParams(filters: MenuItemFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.categoryId) {
      params = params.set('categoryId', filters.categoryId);
    }

    if (filters.isActive !== undefined && filters.isActive !== null) {
      params = params.set('isActive', String(filters.isActive));
    }

    if (filters.isAvailable !== undefined && filters.isAvailable !== null) {
      params = params.set('isAvailable', String(filters.isAvailable));
    }

    return params;
  }
}

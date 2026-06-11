import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CatalogCategoryFilters,
  CatalogCategoryResponse,
  CatalogItemFilters,
  CatalogItemResponse,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
  UpdateCatalogItemAvailabilityRequest,
} from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class MyCatalogApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/my/catalog`;

  getCategories(filters: CatalogCategoryFilters = {}): Observable<CatalogCategoryResponse[]> {
    return this.http.get<CatalogCategoryResponse[]>(`${this.baseUrl}/categories`, {
      params: this.buildCategoryParams(filters),
    });
  }

  createCategory(request: CreateCatalogCategoryRequest): Observable<CatalogCategoryResponse> {
    return this.http.post<CatalogCategoryResponse>(`${this.baseUrl}/categories`, request);
  }

  updateCategory(id: string, request: UpdateCatalogCategoryRequest): Observable<CatalogCategoryResponse> {
    return this.http.put<CatalogCategoryResponse>(`${this.baseUrl}/categories/${id}`, request);
  }

  getItems(filters: CatalogItemFilters = {}): Observable<CatalogItemResponse[]> {
    return this.http.get<CatalogItemResponse[]>(`${this.baseUrl}/items`, {
      params: this.buildItemParams(filters),
    });
  }

  createItem(request: FormData): Observable<CatalogItemResponse> {
    return this.http.post<CatalogItemResponse>(`${this.baseUrl}/items`, request);
  }

  updateItem(id: string, request: FormData): Observable<CatalogItemResponse> {
    return this.http.put<CatalogItemResponse>(`${this.baseUrl}/items/${id}`, request);
  }

  updateItemAvailability(id: string, request: UpdateCatalogItemAvailabilityRequest): Observable<CatalogItemResponse> {
    return this.http.patch<CatalogItemResponse>(`${this.baseUrl}/${'items'}/${id}/availability`, request);
  }

  private buildCategoryParams(filters: CatalogCategoryFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.isActive !== undefined && filters.isActive !== null) {
      params = params.set('isActive', String(filters.isActive));
    }

    return params;
  }

  private buildItemParams(filters: CatalogItemFilters): HttpParams {
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

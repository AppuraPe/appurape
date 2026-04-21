import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  MenuCategoryResponse,
  MenuItemResponse,
  UpdateMenuCategoryRequest,
  UpdateMenuItemAvailabilityRequest,
  UpdateMenuItemRequest,
} from '../models/restaurant.models';

@Injectable({ providedIn: 'root' })
export class MyMenuApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/my/menu`;

  getCategories(): Observable<MenuCategoryResponse[]> {
    return this.http.get<MenuCategoryResponse[]>(`${this.baseUrl}/categories`);
  }

  createCategory(request: CreateMenuCategoryRequest): Observable<MenuCategoryResponse> {
    return this.http.post<MenuCategoryResponse>(`${this.baseUrl}/categories`, request);
  }

  updateCategory(id: string, request: UpdateMenuCategoryRequest): Observable<MenuCategoryResponse> {
    return this.http.put<MenuCategoryResponse>(`${this.baseUrl}/categories/${id}`, request);
  }

  getItems(): Observable<MenuItemResponse[]> {
    return this.http.get<MenuItemResponse[]>(`${this.baseUrl}/items`);
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
}

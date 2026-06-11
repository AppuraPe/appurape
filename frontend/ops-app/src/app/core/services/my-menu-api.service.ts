import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CatalogCategoryFilters,
  CatalogCategoryResponse,
  CatalogItemFilters,
  CatalogItemResponse,
  CreateCatalogCategoryRequest,
  UpdateCatalogCategoryRequest,
  UpdateCatalogItemAvailabilityRequest,
} from '../models/business.model';
import { MyCatalogApiService } from './my-catalog-api.service';

@Injectable({ providedIn: 'root' })
export class MyMenuApiService {
  private readonly myCatalogApi = inject(MyCatalogApiService);

  getCategories(filters: CatalogCategoryFilters = {}): Observable<CatalogCategoryResponse[]> {
    return this.myCatalogApi.getCategories(filters);
  }

  createCategory(request: CreateCatalogCategoryRequest): Observable<CatalogCategoryResponse> {
    return this.myCatalogApi.createCategory(request);
  }

  updateCategory(id: string, request: UpdateCatalogCategoryRequest): Observable<CatalogCategoryResponse> {
    return this.myCatalogApi.updateCategory(id, request);
  }

  getItems(filters: CatalogItemFilters = {}): Observable<CatalogItemResponse[]> {
    return this.myCatalogApi.getItems(filters);
  }

  createItem(request: FormData): Observable<CatalogItemResponse> {
    return this.myCatalogApi.createItem(request);
  }

  updateItem(id: string, request: FormData): Observable<CatalogItemResponse> {
    return this.myCatalogApi.updateItem(id, request);
  }

  updateItemAvailability(id: string, request: UpdateCatalogItemAvailabilityRequest): Observable<CatalogItemResponse> {
    return this.myCatalogApi.updateItemAvailability(id, request);
  }
}

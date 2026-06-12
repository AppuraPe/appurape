import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BusinessBrowseFilters,
  BusinessDetailResponse,
  BusinessListItemResponse,
  BusinessTypeListItemResponse,
  CatalogResponse,
  PublicBusinessMobileHomeResponse,
  PublicBusinessSearchResponse,
} from '../models/businesses.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class BusinessesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/businesses');
  private readonly businessTypesUrl = buildApiUrl('/api/business-types');
  private readonly searchUrl = buildApiUrl('/api/search');

  getBusinesses(filters: BusinessBrowseFilters = {}): Observable<BusinessListItemResponse[]> {
    const params = new URLSearchParams();

    if (filters.q?.trim()) {
      params.set('q', filters.q.trim());
    }

    if (filters.zoneId?.trim()) {
      params.set('zoneId', filters.zoneId.trim());
    }

    if (filters.businessTypeId?.trim()) {
      params.set('businessTypeId', filters.businessTypeId.trim());
    }

    if (filters.openNow) {
      params.set('openNow', 'true');
    }

    if (filters.sort?.trim()) {
      params.set('sort', filters.sort.trim());
    }

    if (filters.page) {
      params.set('page', filters.page.toString());
    }

    if (filters.pageSize) {
      params.set('pageSize', filters.pageSize.toString());
    }

    const queryString = params.toString();
    const requestUrl = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return this.http.get<BusinessListItemResponse[]>(requestUrl);
  }

  getMobileHome(): Observable<PublicBusinessMobileHomeResponse> {
    return this.http.get<PublicBusinessMobileHomeResponse>(`${this.baseUrl}/mobile-home`);
  }

  getBusinessTypes(): Observable<BusinessTypeListItemResponse[]> {
    return this.http.get<BusinessTypeListItemResponse[]>(this.businessTypesUrl);
  }

  getBusiness(id: string): Observable<BusinessDetailResponse> {
    return this.http.get<BusinessDetailResponse>(`${this.baseUrl}/${id}`);
  }

  getBusinessCatalog(id: string, q?: string): Observable<CatalogResponse> {
    const trimmedQuery = q?.trim();
    const requestUrl = trimmedQuery
      ? `${this.baseUrl}/${id}/catalog?q=${encodeURIComponent(trimmedQuery)}`
      : `${this.baseUrl}/${id}/catalog`;

    return this.http.get<CatalogResponse>(requestUrl);
  }

  searchPublic(q: string): Observable<PublicBusinessSearchResponse> {
    const trimmedQuery = q.trim();
    const requestUrl = `${this.searchUrl}?q=${encodeURIComponent(trimmedQuery)}`;

    return this.http.get<PublicBusinessSearchResponse>(requestUrl);
  }
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BusinessDetailResponse,
  BusinessListItemResponse,
  CatalogResponse,
  PublicBusinessSearchResponse,
} from '../models/businesses.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class BusinessesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/businesses');
  private readonly searchUrl = buildApiUrl('/api/search');

  getBusinesses(q?: string, zoneId?: string): Observable<BusinessListItemResponse[]> {
    const params = new URLSearchParams();

    if (q?.trim()) {
      params.set('q', q.trim());
    }

    if (zoneId?.trim()) {
      params.set('zoneId', zoneId.trim());
    }

    const queryString = params.toString();
    const requestUrl = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    return this.http.get<BusinessListItemResponse[]>(requestUrl);
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

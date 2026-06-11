import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessOrderFilters,
  BusinessOrderListItemResponse,
  UpdateBusinessOrderStatusRequest,
} from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class BusinessOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/business/orders`;

  getOrders(filters: BusinessOrderFilters = {}): Observable<BusinessOrderListItemResponse[]> {
    return this.http.get<BusinessOrderListItemResponse[]>(this.baseUrl, {
      params: this.buildParams(filters),
    });
  }

  updateOrderStatus(id: string, request: UpdateBusinessOrderStatusRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${id}/status`, request);
  }

  private buildParams(filters: BusinessOrderFilters): HttpParams {
    let params = new HttpParams();

    if (filters.q?.trim()) {
      params = params.set('q', filters.q.trim());
    }

    if (filters.status) {
      params = params.set('status', filters.status);
    }

    return params;
  }
}

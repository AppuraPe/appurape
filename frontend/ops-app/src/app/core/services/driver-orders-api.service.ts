import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AvailableDriverOrderListItemResponse,
  DriverAssignedOrderListItemResponse,
  UpdateDriverOrderStatusRequest,
} from '../models/driver.models';

@Injectable({ providedIn: 'root' })
export class DriverOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/driver/orders`;

  getAvailableOrders(): Observable<AvailableDriverOrderListItemResponse[]> {
    return this.http.get<AvailableDriverOrderListItemResponse[]>(`${this.baseUrl}/available`);
  }

  getMyOrders(): Observable<DriverAssignedOrderListItemResponse[]> {
    return this.http.get<DriverAssignedOrderListItemResponse[]>(`${this.baseUrl}/my`);
  }

  takeOrder(id: string): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/${id}/take`, {});
  }

  updateMyOrderStatus(id: string, request: UpdateDriverOrderStatusRequest): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/my/${id}/status`, request);
  }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BusinessOrderDetailResponse,
  BusinessOrderFilters,
  BusinessOrderListItemResponse,
  UpdateBusinessOrderStatusRequest,
} from '../models/business.model';
import { BusinessOrdersApiService } from './business-orders-api.service';

@Injectable({ providedIn: 'root' })
export class RestaurantOrdersApiService {
  private readonly businessOrdersApi = inject(BusinessOrdersApiService);

  getOrders(filters: BusinessOrderFilters = {}): Observable<BusinessOrderListItemResponse[]> {
    return this.businessOrdersApi.getOrders(filters);
  }

  updateOrderStatus(id: string, request: UpdateBusinessOrderStatusRequest): Observable<BusinessOrderDetailResponse> {
    return this.businessOrdersApi.updateOrderStatus(id, request);
  }
}

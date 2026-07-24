import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerAddressResponse, UpsertCustomerAddressRequest } from '../models/customer-addresses.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class CustomerAddressesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/customer/addresses');

  getMyAddresses(): Observable<CustomerAddressResponse[]> {
    return this.http.get<CustomerAddressResponse[]>(this.baseUrl);
  }

  getMyAddress(id: string): Observable<CustomerAddressResponse> {
    return this.http.get<CustomerAddressResponse>(`${this.baseUrl}/${id}`);
  }

  createMyAddress(request: UpsertCustomerAddressRequest): Observable<CustomerAddressResponse> {
    return this.http.post<CustomerAddressResponse>(this.baseUrl, request);
  }

  updateMyAddress(id: string, request: UpsertCustomerAddressRequest): Observable<CustomerAddressResponse> {
    return this.http.put<CustomerAddressResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteMyAddress(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setDefault(id: string): Observable<CustomerAddressResponse> {
    return this.http.post<CustomerAddressResponse>(`${this.baseUrl}/${id}/set-default`, {});
  }
}

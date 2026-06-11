import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyBusinessResponse } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class MyBusinessApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/my/business`;

  getMyBusiness(): Observable<MyBusinessResponse> {
    return this.http.get<MyBusinessResponse>(this.baseUrl);
  }

  updateMyBusiness(request: FormData): Observable<MyBusinessResponse> {
    return this.http.put<MyBusinessResponse>(this.baseUrl, request);
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MyBusinessResponse } from '../models/business.model';

@Injectable({ providedIn: 'root' })
export class MyBusinessApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/my/business`;
  private readonly businessState = signal<MyBusinessResponse | null>(null);

  readonly currentBusiness = this.businessState.asReadonly();

  getMyBusiness(): Observable<MyBusinessResponse> {
    return this.http
      .get<MyBusinessResponse>(this.baseUrl)
      .pipe(tap((business) => this.businessState.set(business)));
  }

  updateMyBusiness(request: FormData): Observable<MyBusinessResponse> {
    return this.http
      .put<MyBusinessResponse>(this.baseUrl, request)
      .pipe(tap((business) => this.businessState.set(business)));
  }
}

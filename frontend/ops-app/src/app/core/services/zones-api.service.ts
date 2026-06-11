import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BusinessZoneListItemResponse } from '../models/businesses.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class ZonesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/zones');

  getZones(): Observable<BusinessZoneListItemResponse[]> {
    return this.http.get<BusinessZoneListItemResponse[]>(this.baseUrl);
  }
}

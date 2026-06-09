import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ZoneListItemResponse } from '../models/restaurants.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class ZonesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/zones');

  getZones(): Observable<ZoneListItemResponse[]> {
    return this.http.get<ZoneListItemResponse[]>(this.baseUrl);
  }
}

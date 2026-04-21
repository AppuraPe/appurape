import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ZoneResponse } from '../models/zone.models';

@Injectable({ providedIn: 'root' })
export class ZoneApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/zones`;

  getZones(): Observable<ZoneResponse[]> {
    return this.http.get<ZoneResponse[]>(this.baseUrl);
  }
}

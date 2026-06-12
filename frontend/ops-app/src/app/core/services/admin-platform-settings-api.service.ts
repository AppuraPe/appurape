import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlatformSettingsResponse } from '../models/platform-settings.models';

@Injectable({ providedIn: 'root' })
export class AdminPlatformSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/platform-settings`;

  getSettings(): Observable<PlatformSettingsResponse> {
    return this.http.get<PlatformSettingsResponse>(this.baseUrl);
  }

  updateSettings(formData: FormData): Observable<PlatformSettingsResponse> {
    return this.http.put<PlatformSettingsResponse>(this.baseUrl, formData);
  }
}

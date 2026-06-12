import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlatformSettingsResponse } from '../models/platform-settings.models';

@Injectable({ providedIn: 'root' })
export class PlatformSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/platform-settings`;

  readonly settings = signal<PlatformSettingsResponse | null>(null);
  readonly isLoaded = signal(false);

  async ensureLoaded(): Promise<void> {
    if (this.isLoaded()) {
      return;
    }

    await this.refresh();
  }

  async refresh(): Promise<void> {
    const response = await firstValueFrom(this.http.get<PlatformSettingsResponse>(this.baseUrl));
    this.settings.set(response);
    this.isLoaded.set(true);
    this.applyFavicon(response.appIconUrl);
  }

  private applyFavicon(iconUrl: string | null): void {
    if (!iconUrl) {
      return;
    }

    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'icon';
      head.appendChild(link);
    }

    link.href = iconUrl;
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import {
  NotificationInboxResponse,
  NotificationUnreadCountResponse,
} from '../models/notification-inbox.models';
import { buildApiUrl } from '../utils/api-utils';

@Injectable({ providedIn: 'root' })
export class NotificationInboxApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = buildApiUrl('/api/notifications');
  private readonly unreadCountState = signal(0);
  private readonly inboxRefreshState = signal(0);

  readonly unreadCount = this.unreadCountState.asReadonly();
  readonly inboxRefresh = this.inboxRefreshState.asReadonly();

  getInbox(page = 1, pageSize = 20, unreadOnly = false): Observable<NotificationInboxResponse> {
    return this.http
      .get<NotificationInboxResponse>(this.baseUrl, { params: { page, pageSize, unreadOnly } })
      .pipe(tap((response) => this.unreadCountState.set(response.unreadCount)));
  }

  refreshUnreadCount(refreshInbox = false): void {
    this.http
      .get<NotificationUnreadCountResponse>(`${this.baseUrl}/unread-count`)
      .pipe(catchError(() => of({ unreadCount: 0 })))
      .subscribe((response) => {
        this.unreadCountState.set(response.unreadCount);
        if (refreshInbox) this.inboxRefreshState.update((version) => version + 1);
      });
  }

  markAsRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {}).pipe(
      tap(() => this.unreadCountState.update((count) => Math.max(0, count - 1))),
    );
  }

  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/read-all`, {}).pipe(
      tap(() => this.unreadCountState.set(0)),
    );
  }

  clearLocalState(): void {
    this.unreadCountState.set(0);
    this.inboxRefreshState.set(0);
  }
}

export interface NotificationInboxItem {
  id: string;
  title: string;
  body: string;
  eventType?: string | null;
  targetRoute?: string | null;
  createdAtUtc: string;
  readAtUtc?: string | null;
}

export interface NotificationInboxResponse {
  items: NotificationInboxItem[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  unreadCount: number;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

type AuthPushContext = {
  authToken: string;
  userId: string;
  role: string;
};

type RegisterDeviceTokenPayload = {
  token: string;
  platform: string;
  deviceId?: string | null;
  appVersion?: string | null;
};

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private static readonly AUTH_TOKEN_STORAGE_KEY = 'iquitosDelivery.app.token';
  private static readonly DEVICE_TOKEN_STORAGE_KEY = 'appurape.push.device-token';
  private static readonly DEVICE_TOKEN_SYNC_SIGNATURE_KEY =
    'appurape.push.device-token.sync-signature';
  private static readonly ANDROID_NOTIFICATION_CHANNEL = {
    id: 'appurape_default',
    name: 'Pedidos y operaciones',
    description: 'Alertas sobre pedidos, pagos y entregas de AppuraPe.',
    importance: 4 as const,
    visibility: 0 as const,
    lights: true,
    lightColor: '#FF6B35',
    vibration: true,
  };

  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notificationsApiUrl = `${environment.apiBaseUrl}/api/notifications/device-token`;

  private listenersAttached = false;
  private currentAuthContext: AuthPushContext | null = null;
  private currentDeviceToken = this.readStorage(PushNotificationService.DEVICE_TOKEN_STORAGE_KEY);
  private lastSyncSignature = this.readStorage(
    PushNotificationService.DEVICE_TOKEN_SYNC_SIGNATURE_KEY,
  );

  async initializeForAuthenticatedUser(context: AuthPushContext): Promise<void> {
    this.currentAuthContext = context;

    if (!(await this.isNativePlatformAsync())) {
      return;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await this.attachListenersAsync(PushNotifications);
      await this.ensureAndroidNotificationChannelAsync(PushNotifications);

      const currentPermission = await PushNotifications.checkPermissions();
      const permission =
        currentPermission.receive === 'prompt'
          ? await PushNotifications.requestPermissions()
          : currentPermission;

      if (permission.receive !== 'granted') {
        return;
      }

      if (this.currentDeviceToken) {
        await this.registerTokenWithBackendAsync(this.currentDeviceToken);
      }

      await PushNotifications.register();
    } catch (error) {
      console.warn('Push notifications initialization failed.', error);
    }
  }

  deactivateCurrentDeviceToken(authToken: string | null | undefined): void {
    if (!authToken || !this.currentDeviceToken) {
      this.currentAuthContext = null;
      return;
    }

    void this.deactivateCurrentDeviceTokenAsync(authToken, this.currentDeviceToken);
    this.currentAuthContext = null;
  }

  private async attachListenersAsync(
    pushNotifications: typeof import('@capacitor/push-notifications').PushNotifications,
  ): Promise<void> {
    if (this.listenersAttached) {
      return;
    }

    await pushNotifications.addListener('registration', (token) => {
      const normalizedToken = token.value?.trim();

      if (!normalizedToken) {
        return;
      }

      this.currentDeviceToken = normalizedToken;
      this.writeStorage(PushNotificationService.DEVICE_TOKEN_STORAGE_KEY, normalizedToken);
      void this.registerTokenWithBackendAsync(normalizedToken);
    });

    await pushNotifications.addListener('registrationError', (error) => {
      console.warn('Push registration error.', error);
    });

    await pushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('Push notification received.', notification);
    });

    await pushNotifications.addListener('pushNotificationActionPerformed', (notificationAction) => {
      console.info('Push notification action performed.', notificationAction);
      void this.handleNotificationActionAsync(notificationAction.notification?.data);
    });

    this.listenersAttached = true;
  }

  private async ensureAndroidNotificationChannelAsync(
    pushNotifications: typeof import('@capacitor/push-notifications').PushNotifications,
  ): Promise<void> {
    if ((await this.resolvePlatformAsync()) !== 'android') {
      return;
    }

    try {
      await pushNotifications.createChannel(PushNotificationService.ANDROID_NOTIFICATION_CHANNEL);
    } catch (error) {
      // Notification channels do not exist before Android 8; token registration must still continue.
      console.warn('Android notification channel initialization failed or is unavailable.', error);
    }
  }

  private async registerTokenWithBackendAsync(token: string): Promise<void> {
    const context = this.currentAuthContext;

    if (!context) {
      return;
    }

    const normalizedToken = token.trim();

    if (!normalizedToken) {
      return;
    }

    const syncSignature = `${context.userId}:${normalizedToken}`;
    if (this.lastSyncSignature === syncSignature) {
      return;
    }

    try {
      const payload: RegisterDeviceTokenPayload = {
        token: normalizedToken,
        platform: await this.resolvePlatformAsync(),
        appVersion: await this.resolveAppVersionAsync(),
        deviceId: null,
      };

      await firstValueFrom(
        this.http.post<void>(this.notificationsApiUrl, payload, {
          headers: this.createAuthHeaders(context.authToken),
        }),
      );

      this.lastSyncSignature = syncSignature;
      this.writeStorage(PushNotificationService.DEVICE_TOKEN_SYNC_SIGNATURE_KEY, syncSignature);
    } catch (error) {
      console.warn('Device token sync failed.', error);
    }
  }

  private async deactivateCurrentDeviceTokenAsync(authToken: string, token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(
          `${this.notificationsApiUrl}/deactivate`,
          { token },
          {
            headers: this.createAuthHeaders(authToken),
          },
        ),
      );
    } catch (error) {
      console.warn('Device token deactivation failed.', error);
    } finally {
      this.lastSyncSignature = null;
      this.writeStorage(PushNotificationService.DEVICE_TOKEN_SYNC_SIGNATURE_KEY, null);
    }
  }

  private createAuthHeaders(authToken: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${authToken}`,
    });
  }

  private async isNativePlatformAsync(): Promise<boolean> {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  }

  private async resolvePlatformAsync(): Promise<string> {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.getPlatform();
  }

  private async resolveAppVersionAsync(): Promise<string | null> {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return info.version?.trim() || null;
    } catch {
      return null;
    }
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string | null): void {
    try {
      if (value === null) {
        localStorage.removeItem(key);
        return;
      }

      localStorage.setItem(key, value);
    } catch {
      // ignore storage failures and continue in memory
    }
  }

  private async handleNotificationActionAsync(data: unknown): Promise<void> {
    const targetRoute = this.extractTargetRoute(data);

    if (!targetRoute) {
      return;
    }

    try {
      const authToken = this.readStorage(PushNotificationService.AUTH_TOKEN_STORAGE_KEY);

      if (!authToken) {
        await this.router.navigate(['/login'], {
          queryParams: {
            redirectTo: targetRoute,
          },
        });
        return;
      }

      await this.router.navigateByUrl(targetRoute);
    } catch (error) {
      console.warn('Push notification navigation failed.', error);
    }
  }

  private extractTargetRoute(data: unknown): string | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const maybeRoute =
      'targetRoute' in data ? (data as Record<string, unknown>)['targetRoute'] : null;

    if (typeof maybeRoute !== 'string') {
      return null;
    }

    const normalizedRoute = maybeRoute.trim();
    return normalizedRoute.startsWith('/') ? normalizedRoute : null;
  }
}

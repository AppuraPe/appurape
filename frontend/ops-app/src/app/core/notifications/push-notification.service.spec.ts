import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PushNotificationService } from './push-notification.service';

const capacitorMocks = vi.hoisted(() => ({
  addListener: vi.fn(),
  checkPermissions: vi.fn(),
  createChannel: vi.fn(),
  getInfo: vi.fn(),
  getPlatform: vi.fn(),
  httpPost: vi.fn(),
  isNativePlatform: vi.fn(),
  listeners: new Map<string, (payload: unknown) => void>(),
  register: vi.fn(),
  requestPermissions: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: capacitorMocks.getPlatform,
    isNativePlatform: capacitorMocks.isNativePlatform,
  },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    getInfo: capacitorMocks.getInfo,
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    addListener: capacitorMocks.addListener,
    checkPermissions: capacitorMocks.checkPermissions,
    createChannel: capacitorMocks.createChannel,
    register: capacitorMocks.register,
    requestPermissions: capacitorMocks.requestPermissions,
  },
}));

describe('PushNotificationService', () => {
  beforeEach(() => {
    localStorage.clear();
    capacitorMocks.listeners.clear();
    vi.clearAllMocks();

    capacitorMocks.isNativePlatform.mockReturnValue(true);
    capacitorMocks.getPlatform.mockReturnValue('android');
    capacitorMocks.getInfo.mockResolvedValue({ version: '2.4.1' });
    capacitorMocks.checkPermissions.mockResolvedValue({ receive: 'granted' });
    capacitorMocks.createChannel.mockResolvedValue(undefined);
    capacitorMocks.register.mockResolvedValue(undefined);
    capacitorMocks.requestPermissions.mockResolvedValue({ receive: 'granted' });
    capacitorMocks.httpPost.mockReturnValue(of(undefined));
    capacitorMocks.addListener.mockImplementation(
      async (eventName: string, listener: (payload: unknown) => void) => {
        capacitorMocks.listeners.set(eventName, listener);
        return { remove: vi.fn() };
      },
    );

    TestBed.configureTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: HttpClient,
          useValue: { post: capacitorMocks.httpPost },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn(),
            navigateByUrl: vi.fn(),
          },
        },
      ],
    });
  });

  it('creates appurape_default before requesting permission and registering with FCM', async () => {
    const service = TestBed.inject(PushNotificationService);

    await service.initializeForAuthenticatedUser({
      authToken: 'jwt-test',
      userId: 'user-1',
      role: 'Driver',
    });

    expect(capacitorMocks.createChannel).toHaveBeenCalledWith({
      id: 'appurape_default',
      name: 'Pedidos y operaciones',
      description: 'Alertas sobre pedidos, pagos y entregas de AppuraPe.',
      importance: 4,
      visibility: 0,
      lights: true,
      lightColor: '#FF6B35',
      vibration: true,
    });
    expect(capacitorMocks.createChannel.mock.invocationCallOrder[0]).toBeLessThan(
      capacitorMocks.checkPermissions.mock.invocationCallOrder[0],
    );
    expect(capacitorMocks.checkPermissions.mock.invocationCallOrder[0]).toBeLessThan(
      capacitorMocks.register.mock.invocationCallOrder[0],
    );
  });

  it('continues FCM registration when notification channels are unavailable', async () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    capacitorMocks.createChannel.mockRejectedValue(new Error('Not available before Android 8'));
    const service = TestBed.inject(PushNotificationService);

    await service.initializeForAuthenticatedUser({
      authToken: 'jwt-test',
      userId: 'user-1',
      role: 'Driver',
    });

    expect(capacitorMocks.checkPermissions).toHaveBeenCalledTimes(1);
    expect(capacitorMocks.register).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledOnce();
    consoleWarn.mockRestore();
  });

  it('registers a cached FCM token for the authenticated user', async () => {
    localStorage.setItem('appurape.push.device-token', 'cached-fcm-token');
    const service = TestBed.inject(PushNotificationService);

    await service.initializeForAuthenticatedUser({
      authToken: 'jwt-test',
      userId: 'user-1',
      role: 'Restaurant',
    });

    expect(capacitorMocks.httpPost).toHaveBeenCalledTimes(1);
    const [url, payload, options] = capacitorMocks.httpPost.mock.calls[0];

    expect(url).toBe(`${environment.apiBaseUrl}/api/notifications/device-token`);
    expect(payload).toEqual({
      token: 'cached-fcm-token',
      platform: 'android',
      appVersion: '2.4.1',
      deviceId: null,
    });
    expect((options as { headers: HttpHeaders }).headers.get('Authorization')).toBe(
      'Bearer jwt-test',
    );
  });

  it('normalizes and syncs a refreshed FCM token emitted by the native plugin', async () => {
    const service = TestBed.inject(PushNotificationService);

    await service.initializeForAuthenticatedUser({
      authToken: 'jwt-test',
      userId: 'user-1',
      role: 'Admin',
    });

    const registrationListener = capacitorMocks.listeners.get('registration');
    expect(registrationListener).toBeDefined();
    registrationListener?.({ value: '  refreshed-fcm-token  ' });

    await vi.waitFor(() => expect(capacitorMocks.httpPost).toHaveBeenCalledTimes(1));
    expect(capacitorMocks.httpPost.mock.calls[0][1]).toEqual(
      expect.objectContaining({ token: 'refreshed-fcm-token' }),
    );
    expect(localStorage.getItem('appurape.push.device-token')).toBe('refreshed-fcm-token');
  });

  it('shows a non-blocking reminder without opening the Android prompt automatically', async () => {
    capacitorMocks.checkPermissions.mockResolvedValue({ receive: 'prompt' });
    const service = TestBed.inject(PushNotificationService);
    await service.initializeForAuthenticatedUser({ authToken: 'jwt-test', userId: 'user-1', role: 'Customer' });
    expect(service.permissionReminderVisible()).toBe(true);
    expect(capacitorMocks.requestPermissions).not.toHaveBeenCalled();
    expect(capacitorMocks.register).not.toHaveBeenCalled();
  });

  it('does not show the reminder again before 24 hours', async () => {
    capacitorMocks.checkPermissions.mockResolvedValue({ receive: 'denied' });
    localStorage.setItem('appurape.push.permission-reminder-at', String(Date.now() - 23 * 60 * 60 * 1000));
    const service = TestBed.inject(PushNotificationService);
    await service.initializeForAuthenticatedUser({ authToken: 'jwt-test', userId: 'user-1', role: 'Driver' });
    expect(service.permissionReminderVisible()).toBe(false);
  });

  it('requests permission only after the user taps activate', async () => {
    capacitorMocks.checkPermissions.mockResolvedValue({ receive: 'prompt' });
    const service = TestBed.inject(PushNotificationService);
    await service.initializeForAuthenticatedUser({ authToken: 'jwt-test', userId: 'user-1', role: 'Restaurant' });
    await service.enableNotifications();
    expect(capacitorMocks.requestPermissions).toHaveBeenCalledTimes(1);
    expect(capacitorMocks.register).toHaveBeenCalledTimes(1);
  });
});

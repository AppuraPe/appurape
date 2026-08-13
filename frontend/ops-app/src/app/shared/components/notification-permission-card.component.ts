import { Component, inject } from '@angular/core';
import { PushNotificationService } from '../../core/notifications/push-notification.service';
import { AuthService } from '../../core/services/auth.service';
import { AppButtonComponent } from './app-button.component';

@Component({ selector: 'app-notification-permission-card', standalone: true, imports: [AppButtonComponent], template: `
  @if (auth.isAuthenticated() && push.permissionReminderVisible()) {
    <aside class="fixed inset-x-3 bottom-[calc(82px+env(safe-area-inset-bottom,0px))] z-[120] mx-auto grid max-w-md gap-3 rounded-[20px] border border-orange-200 bg-white p-4 shadow-2xl" aria-live="polite">
      <div class="min-w-0"><strong class="block text-sm text-slate-950">Activa las notificaciones</strong><p class="mt-1 text-xs leading-5 text-slate-600">Recibe cambios de pedidos, entregas y favores. Es opcional y puedes cambiarlo cuando quieras.</p></div>
      <div class="grid grid-cols-2 gap-2"><app-button size="sm" variant="secondary" block (click)="push.dismissPermissionReminder()">Ahora no</app-button><app-button size="sm" block (click)="push.enableNotifications()">{{ push.permissionState() === 'denied' ? 'Abrir ajustes' : 'Activar' }}</app-button></div>
    </aside>
  }` })
export class NotificationPermissionCardComponent { readonly push = inject(PushNotificationService); readonly auth = inject(AuthService); }

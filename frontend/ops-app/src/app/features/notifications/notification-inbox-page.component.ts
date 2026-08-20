import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Bell, BellRing, CheckCheck, ChevronRight, Inbox, LucideAngularModule, RefreshCw } from 'lucide-angular';
import { finalize } from 'rxjs';
import { NotificationInboxItem } from '../../core/models/notification-inbox.models';
import { NotificationInboxApiService } from '../../core/services/notification-inbox-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';

@Component({
  selector: 'app-notification-inbox-page',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, AppButtonComponent, MobilePageShellComponent],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      [desktopClass]="'md:mx-auto md:max-w-3xl md:px-6 lg:pb-12'"
      [extraClass]="'grid gap-4 px-4 pt-4 md:pt-6'"
    >
      <header class="flex min-w-0 items-start justify-between gap-3">
        <div class="min-w-0">
          <span class="text-[11px] font-black uppercase tracking-[0.07em] text-primary-700">Actividad</span>
          <h1 class="mt-1 text-2xl font-black tracking-[-0.035em] text-slate-950">Notificaciones</h1>
          <p class="mt-1 text-sm leading-5 text-slate-500">Cambios importantes de tus pedidos, pagos y favores.</p>
        </div>
        <div class="flex shrink-0 flex-wrap justify-end gap-2">
          <app-button size="sm" variant="ghost" [loading]="isLoading()" (click)="load(true)">
            <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true" />
            Actualizar
          </app-button>
          @if (unreadCount() > 0) {
            <app-button size="sm" variant="ghost" [loading]="markingAll()" (click)="markAllAsRead()">
              <lucide-angular class="h-4 w-4" [img]="checkAllIcon" aria-hidden="true" />
              Leer todo
            </app-button>
          }
        </div>
      </header>

      <nav class="grid h-[52px] grid-cols-2 gap-2 rounded-[18px] bg-slate-100 p-1" aria-label="Filtros de notificaciones">
        <button
          type="button"
          class="flex h-11 items-center justify-center rounded-[14px] px-3 text-sm font-black leading-none transition"
          [class.bg-white]="filter() === 'all'"
          [class.text-slate-950]="filter() === 'all'"
          [class.shadow-sm]="filter() === 'all'"
          [class.text-slate-500]="filter() !== 'all'"
          [attr.aria-pressed]="filter() === 'all'"
          (click)="setFilter('all')"
        >
          Todas
        </button>
        <button
          type="button"
          class="flex h-11 items-center justify-center rounded-[14px] px-3 text-sm font-black leading-none transition"
          [class.bg-white]="filter() === 'unread'"
          [class.text-slate-950]="filter() === 'unread'"
          [class.shadow-sm]="filter() === 'unread'"
          [class.text-slate-500]="filter() !== 'unread'"
          [attr.aria-pressed]="filter() === 'unread'"
          (click)="setFilter('unread')"
        >
          No leídas
          @if (unreadCount() > 0) {
            <span class="ml-1 rounded-full bg-primary-600 px-2 py-0.5 text-[10px] text-white">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
          }
        </button>
      </nav>

      @if (isLoading() && items().length === 0) {
        <div class="grid gap-2" aria-label="Cargando notificaciones">
          @for (placeholder of [1, 2, 3]; track placeholder) {
            <div class="flex min-h-[86px] animate-pulse gap-3 rounded-2xl border border-slate-200 bg-white p-3.5">
              <span class="h-10 w-10 shrink-0 rounded-xl bg-slate-100"></span>
              <span class="grid min-w-0 flex-1 gap-2 py-1"><i class="h-3 w-2/3 rounded bg-slate-100"></i><i class="h-3 w-full rounded bg-slate-100"></i><i class="h-2.5 w-24 rounded bg-slate-100"></i></span>
            </div>
          }
        </div>
      } @else if (errorMessage() && items().length === 0) {
        <section class="grid justify-items-center gap-3 rounded-[20px] border border-red-200 bg-red-50 p-5 text-center">
          <p class="text-sm font-semibold text-red-800">{{ errorMessage() }}</p>
          <app-button size="sm" variant="secondary" (click)="load(true)">Reintentar</app-button>
        </section>
      } @else if (items().length === 0) {
        <section class="grid justify-items-center gap-2 rounded-[20px] border border-slate-200 bg-white p-6 text-center shadow-sm">
          <span class="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-700">
            <lucide-angular class="h-6 w-6" [img]="emptyIcon" aria-hidden="true" />
          </span>
          <h2 class="text-base font-black text-slate-950">{{ emptyTitle() }}</h2>
          <p class="max-w-sm text-sm leading-5 text-slate-500">{{ emptyDescription() }}</p>
        </section>
      } @else {
        <section class="grid gap-2" aria-label="Historial de notificaciones">
          @for (item of items(); track item.id) {
            <button
              type="button"
              class="flex w-full min-w-0 items-start gap-3 rounded-2xl border p-3.5 text-left shadow-sm transition active:scale-[0.99]"
              [class.border-primary-200]="!item.readAtUtc"
              [class.bg-primary-50]="!item.readAtUtc"
              [class.border-slate-200]="!!item.readAtUtc"
              [class.bg-white]="!!item.readAtUtc"
              (click)="open(item)"
            >
              <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-primary-700 shadow-sm">
                <lucide-angular class="h-5 w-5" [img]="item.readAtUtc ? bellIcon : unreadIcon" aria-hidden="true" />
                @if (!item.readAtUtc) { <i class="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-primary-50 bg-primary-600"></i> }
              </span>
              <span class="grid min-w-0 flex-1 gap-1">
                <strong class="break-words text-sm font-black leading-5 text-slate-950">{{ item.title }}</strong>
                <span class="break-words text-[13px] leading-5 text-slate-600">{{ item.body }}</span>
                <time class="text-[11px] font-semibold text-slate-400" [attr.datetime]="item.createdAtUtc">{{ item.createdAtUtc | date:'d MMM, h:mm a' }}</time>
              </span>
              @if (item.targetRoute) { <lucide-angular class="mt-3 h-4 w-4 shrink-0 text-slate-400" [img]="chevronIcon" aria-hidden="true" /> }
            </button>
          }
        </section>

        @if (hasMore()) {
          <app-button variant="secondary" size="md" block [loading]="isLoading()" (click)="load(false)">Ver anteriores</app-button>
        }
      }
    </app-mobile-page-shell>
  `,
})
export class NotificationInboxPageComponent {
  private readonly api = inject(NotificationInboxApiService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private observedRefreshVersion = 0;

  readonly items = signal<NotificationInboxItem[]>([]);
  readonly filter = signal<'all' | 'unread'>('all');
  readonly isLoading = signal(false);
  readonly markingAll = signal(false);
  readonly errorMessage = signal('');
  readonly page = signal(0);
  readonly hasMore = signal(false);
  readonly unreadCount = this.api.unreadCount;
  readonly bellIcon = Bell;
  readonly unreadIcon = BellRing;
  readonly emptyIcon = Inbox;
  readonly checkAllIcon = CheckCheck;
  readonly chevronIcon = ChevronRight;
  readonly refreshIcon = RefreshCw;

  constructor() {
    this.load(true);
    effect(() => {
      const version = this.api.inboxRefresh();
      if (version === this.observedRefreshVersion) return;
      this.observedRefreshVersion = version;
      if (version > 0) queueMicrotask(() => this.load(true));
    });
  }

  setFilter(filter: 'all' | 'unread'): void {
    if (this.filter() === filter) return;
    this.filter.set(filter);
    this.load(true);
  }

  load(reset: boolean): void {
    if (this.isLoading()) return;
    const nextPage = reset ? 1 : this.page() + 1;
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.api.getInbox(nextPage, 20, this.filter() === 'unread').pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (response) => {
        this.items.set(reset ? response.items : [...this.items(), ...response.items]);
        this.page.set(response.page);
        this.hasMore.set(response.hasMore);
      },
      error: () => this.errorMessage.set('No pudimos cargar tus notificaciones.'),
    });
  }

  open(item: NotificationInboxItem): void {
    const navigate = () => {
      const targetRoute = this.safeTargetRoute(item.targetRoute);
      if (targetRoute) void this.router.navigateByUrl(targetRoute);
      else this.notifications.info('Esta notificación no tiene una ruta disponible.');
    };
    if (item.readAtUtc) {
      navigate();
      return;
    }

    this.api.markAsRead(item.id).subscribe({
      next: () => {
        const readAtUtc = new Date().toISOString();
        this.items.update((items) => this.filter() === 'unread'
          ? items.filter((entry) => entry.id !== item.id)
          : items.map((entry) => entry.id === item.id ? { ...entry, readAtUtc } : entry));
        navigate();
      },
      error: () => this.notifications.error('No pudimos actualizar la notificación.'),
    });
  }

  markAllAsRead(): void {
    if (this.markingAll()) return;
    this.markingAll.set(true);
    this.api.markAllAsRead().pipe(finalize(() => this.markingAll.set(false))).subscribe({
      next: () => {
        const now = new Date().toISOString();
        this.items.update((items) => this.filter() === 'unread'
          ? []
          : items.map((item) => ({ ...item, readAtUtc: item.readAtUtc || now })));
      },
      error: () => this.notifications.error('No pudimos marcar las notificaciones como leídas.'),
    });
  }

  emptyTitle(): string {
    return this.filter() === 'unread' ? 'No tienes no leídas' : 'Todo está al día';
  }

  emptyDescription(): string {
    return this.filter() === 'unread'
      ? 'Cuando tengas avisos pendientes aparecerán aquí.'
      : 'Aquí aparecerán los avisos importantes relacionados con tu actividad.';
  }

  private safeTargetRoute(targetRoute?: string | null): string | null {
    const normalized = targetRoute?.trim();
    return normalized?.startsWith('/') && !normalized.startsWith('//') ? normalized : null;
  }
}

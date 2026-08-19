import { Component, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  Bike,
  Bell,
  ClipboardList,
  CircleDollarSign,
  CreditCard,
  Ellipsis,
  HeartHandshake,
  Home,
  LucideAngularModule,
  Package,
  ReceiptText,
  UserRound,
  Store,
  Tags,
} from 'lucide-angular';
import { AuthService } from '../core/services/auth.service';
import { MyBusinessApiService } from '../core/services/my-business-api.service';
import { PlatformSettingsApiService } from '../core/services/platform-settings-api.service';
import { NotificationInboxApiService } from '../core/services/notification-inbox-api.service';
import { MobilePageShellComponent } from '../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../shared/components/status-badge.component';

interface NavItem {
  label: string;
  path: string;
  helper?: string;
  exact?: boolean;
  icon?: typeof Home;
  badge?: () => number;
}

@Component({
  selector: 'app-ops-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, StatusBadgeComponent, MobilePageShellComponent],
  template: `
    <div class="grid min-h-dvh bg-slate-50 xl:grid-cols-[304px_minmax(0,1fr)]">
      <aside class="z-20 hidden flex-col gap-3 border-b border-slate-200 bg-white/95 px-3 pb-3 pt-[max(12px,env(safe-area-inset-top,0px))] backdrop-blur xl:sticky xl:top-0 xl:flex xl:h-screen xl:justify-between xl:gap-5 xl:overflow-y-auto xl:border-r xl:border-b-0 xl:bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] xl:p-4 xl:backdrop-blur-0">
        <div class="grid gap-4">
          <a class="flex items-center text-primary-900 no-underline" [routerLink]="defaultRoute()">
            @if (branding()?.logoUrl && !brandingLogoFailed()) {
              <img
                class="block h-20 w-auto max-w-[320px] object-contain"
                [src]="branding()!.logoUrl!"
                alt=""
                aria-hidden="true"
                (error)="markBrandingLogoFailed()"
              />
            } @else {
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-lg shadow-primary-700/20">AP</span>
            }
            @if (!branding()?.logoUrl || brandingLogoFailed()) {
              <span class="pl-3 text-[1.25rem] font-black tracking-[-0.04em]">
                {{ branding()?.appName || 'AppuraPe' }}
                <small class="block text-xs font-bold tracking-normal text-text-muted">
                  {{ branding()?.tagline || (branding()?.appName || 'AppuraPe') }}
                </small>
              </span>
            }
          </a>

          <div class="grid gap-2 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm">
            <div class="flex min-w-0 items-center gap-3">
              @if (headerImageUrl() && !headerImageFailed()) {
                <img class="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white object-cover" [src]="headerImageUrl()!" [alt]="headerImageAlt()" (error)="markHeaderImageFailed()" />
              } @else {
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-700 text-xs font-black uppercase text-white">{{ headerInitials() }}</span>
              }
              <div class="grid min-w-0 gap-0.5">
                <span class="text-[0.7rem] font-black uppercase tracking-[0.08em] text-slate-500">Sesión activa</span>
                <strong class="truncate text-base text-loreto-carbon">{{ headerDisplayName() }}</strong>
                <small class="truncate text-sm text-text-muted">{{ currentUser()?.email || 'Sin email' }}</small>
              </div>
            </div>
            <app-status-badge [status]="currentUser()?.role" prefix="Rol" />
          </div>

          <a routerLink="/notifications" class="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 no-underline shadow-sm transition hover:text-primary-700">
            <span class="inline-flex items-center gap-2"><lucide-angular class="h-4 w-4" [img]="bellIcon" aria-hidden="true" /> Notificaciones</span>
            @if (unreadNotificationCount() > 0) { <span class="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-black text-primary-700">{{ unreadNotificationCount() }}</span> }
          </a>

          <div class="px-1 text-[0.76rem] font-black uppercase tracking-[0.08em] text-slate-500">{{ navHeading() }}</div>
          <nav class="grid gap-2" aria-label="Navegación operativa de escritorio">
            @for (item of navItems(); track item.path) {
              <a
                routerLinkActive="active-link"
                [routerLinkActiveOptions]="{ exact: item.exact ?? true }"
                [routerLink]="item.path"
                class="grid min-h-[54px] min-w-0 justify-start gap-1 rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-base font-extrabold text-text-muted no-underline transition hover:bg-white hover:text-primary-700"
              >
                <span>{{ item.label }}</span>
                @if (item.helper) {
                  <small class="text-xs font-medium">{{ item.helper }}</small>
                }
              </a>
            }
          </nav>
        </div>

        <button class="button secondary min-h-11 w-full shrink-0 rounded-2xl px-4 xl:sticky xl:bottom-4" type="button" (click)="logout()">
          Cerrar sesión
        </button>
      </aside>

      <main class="min-w-0 overflow-x-hidden">
        <app-mobile-page-shell
          [backgroundClass]="'bg-slate-50'"
          [bottomSpacingClass]="'pb-[calc(88px+env(safe-area-inset-bottom,0px))]'"
          [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'"
          [extraClass]="'px-4 pt-[max(18px,env(safe-area-inset-top,0px))] md:px-6 md:pt-6 xl:px-6 xl:pt-0'"
        >
          <router-outlet />
        </app-mobile-page-shell>
      </main>

      <nav class="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur xl:hidden" aria-label="Navegación operativa móvil">
        <div
          class="mx-auto grid max-w-[520px] gap-1"
          [style.grid-template-columns]="'repeat(' + mobileNavItems().length + ', minmax(0, 1fr))'"
        >
          @for (item of mobileNavItems(); track item.path) {
            <a
              routerLinkActive="text-primary-700 font-extrabold"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              [routerLink]="item.path"
              class="group relative flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[0.68rem] font-bold leading-tight text-slate-500 no-underline transition active:scale-[0.98]"
            >
              <div class="relative">
                @if (item.icon) {
                  <lucide-angular class="h-5 w-5 transition group-[.text-primary-700]:scale-110" [img]="item.icon" aria-hidden="true"></lucide-angular>
                }
                @if (item.badge && item.badge()! > 0) {
                  <span class="absolute -right-2 -top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-primary-600 px-1 text-[9px] font-black leading-none text-white ring-2 ring-white">
                    {{ item.badge()! > 99 ? '99+' : item.badge()! }}
                  </span>
                }
              </div>
              <span class="line-clamp-1">{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>
    </div>
  `,
})
export class OpsLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);
  private readonly myBusinessApi = inject(MyBusinessApiService);
  private readonly notificationInbox = inject(NotificationInboxApiService);

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly defaultRoute = computed(() => this.authService.getDefaultRoute());
  readonly branding = this.platformSettingsApi.settings;
  readonly brandingLogoFailed = signal(false);
  readonly headerImageFailed = signal(false);
  readonly currentBusiness = this.myBusinessApi.currentBusiness;
  readonly unreadNotificationCount = this.notificationInbox.unreadCount;
  readonly bellIcon = Bell;
  readonly headerDisplayName = computed(() => {
    if (this.authService.getCurrentRole() === 'Restaurant') {
      return this.currentBusiness()?.name || this.currentUser()?.fullName || 'Negocio';
    }

    return this.currentUser()?.fullName || this.currentUser()?.email || 'Operador';
  });
  readonly headerImageUrl = computed(() => {
    const role = this.authService.getCurrentRole();

    if (role === 'Restaurant') {
      return this.currentBusiness()?.logoUrl?.trim() || null;
    }

    if (role === 'Admin') {
      return this.branding()?.logoUrl?.trim() || null;
    }

    return null;
  });
  readonly headerImageAlt = computed(() =>
    this.authService.getCurrentRole() === 'Restaurant'
      ? `Logo de ${this.headerDisplayName()}`
      : `Foto de ${this.headerDisplayName()}`,
  );
  readonly headerInitials = computed(() => {
    const words = this.headerDisplayName().trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((word) => word.charAt(0)).join('').toUpperCase() || 'AP';
  });

  readonly navHeading = computed(() => {
    const role = this.authService.getCurrentRole();

    if (role === 'Admin') {
      return 'Administración';
    }

    if (role === 'Restaurant') {
      return 'Negocio';
    }

    if (role === 'Driver') {
      return 'Driver';
    }

    return this.branding()?.appName || 'AppuraPe';
  });

  readonly mobileHeaderSubtitle = computed(() => {
    const role = this.authService.getCurrentRole();

    if (role === 'Admin') {
      return 'Control de red';
    }

    if (role === 'Restaurant') {
      return 'Pedidos y catálogo';
    }

    if (role === 'Driver') {
      return 'Entregas activas';
    }

    return this.currentUser()?.fullName || this.currentUser()?.email || 'Operador';
  });

  readonly mobileAccountRoute = computed(() => {
    const role = this.authService.getCurrentRole();

    if (role === 'Admin') {
      return '/admin/dashboard';
    }

    if (role === 'Restaurant') {
      return '/business/profile';
    }

    if (role === 'Driver') {
      return '/driver/profile';
    }

    return this.authService.getDefaultRoute();
  });

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.authService.getCurrentRole();

    switch (role) {
      case 'Restaurant':
        return [
          { label: 'Inicio', path: '/business/dashboard', helper: 'Estado y resumen' },
          { label: 'Pedidos', path: '/business/orders', helper: 'Preparación y recojo', exact: false },
          { label: 'Perfil', path: '/business/profile', helper: 'Visibilidad pública' },
          { label: 'Categorías', path: '/business/menu/categories', helper: 'Organiza catálogo' },
          { label: 'Productos', path: '/business/menu/items', helper: 'Disponibilidad' },
        ];
      case 'Driver':
        return [
          { label: 'Inicio', path: '/driver/dashboard', helper: 'Estado operativo' },
          { label: 'Pedidos disponibles', path: '/driver/orders', helper: 'Listos para tomar' },
          { label: 'Pedido activo', path: '/driver/active-order', helper: 'Entrega en curso', exact: false },
          { label: 'Mis pedidos', path: '/driver/orders/my', helper: 'Historial operativo', exact: false },
          { label: 'Mi perfil', path: '/driver/profile', helper: 'Cuenta y confianza' },
        ];
      case 'Admin':
        return [
          { label: 'Inicio', path: '/admin/dashboard', helper: 'Pendientes clave' },
          { label: 'Favores', path: '/admin/community', helper: 'Colaboradores y métricas', exact: false },
          { label: 'Marca', path: '/admin/settings/branding', helper: 'Logo, icono y splash' },
          { label: 'Legal', path: '/admin/legal', helper: 'Privacidad y condiciones' },
          { label: 'Pagos', path: '/admin/payments', helper: 'Yape y Plin pendientes', exact: false },
          { label: 'Comisiones', path: '/admin/commissions', helper: 'Ingresos y deuda Cash', exact: false },
          { label: 'Liquidaciones', path: '/admin/settlements', helper: 'Pagos manuales', exact: false },
          { label: 'Verificaciones', path: '/admin/collaborator-verifications', helper: 'Colaboradores', exact: false },
          { label: 'Categorías de negocios', path: '/admin/business-types', helper: 'Tipos, iconos y estado' },
          { label: 'Negocios pendientes', path: '/admin/businesses/pending', helper: 'Aprobar o rechazar' },
          { label: 'Drivers pendientes', path: '/admin/drivers/pending', helper: 'Aprobar o rechazar' },
          { label: 'Todos los negocios', path: '/admin/businesses', helper: 'Estados y detalle', exact: false },
          { label: 'Todos los drivers', path: '/admin/drivers', helper: 'Estados y detalle', exact: false },
        ];
      default:
        return [{ label: 'Inicio', path: this.authService.getDefaultRoute(), helper: 'Panel principal' }];
    }
  });

  readonly mobileNavItems = computed<NavItem[]>(() => {
    const role = this.authService.getCurrentRole();

    switch (role) {
      case 'Restaurant':
        return [
          { label: 'Pedidos', path: '/business/orders', exact: false, icon: ClipboardList },
          { label: 'Catálogo', path: '/business/menu/items', exact: false, icon: Package },
          { label: 'Avisos', path: '/notifications', exact: true, icon: Bell, badge: () => this.unreadNotificationCount() },
          { label: 'Perfil', path: '/business/profile', exact: false, icon: Store },
          { label: 'Más', path: '/business/dashboard', exact: true, icon: Ellipsis },
        ];
      case 'Driver':
        return [
          { label: 'Disponibles', path: '/driver/orders', exact: true, icon: Bike },
          { label: 'Activo', path: '/driver/active-order', exact: false, icon: ClipboardList },
          { label: 'Avisos', path: '/notifications', exact: true, icon: Bell, badge: () => this.unreadNotificationCount() },
          { label: 'Historial', path: '/driver/orders/my', exact: false, icon: Tags },
          { label: 'Perfil', path: '/driver/profile', exact: false, icon: UserRound },
        ];
      case 'Admin':
        return [
          { label: 'Inicio', path: '/admin/dashboard', exact: true, icon: Home },
          { label: 'Pagos', path: '/admin/payments', exact: false, icon: CreditCard },
          { label: 'Avisos', path: '/notifications', exact: true, icon: Bell, badge: () => this.unreadNotificationCount() },
          { label: 'Comisiones', path: '/admin/commissions', exact: false, icon: CircleDollarSign },
          { label: 'Negocios', path: '/admin/businesses', exact: false, icon: Store },
        ];
      default:
        return [
          { label: 'Inicio', path: this.authService.getDefaultRoute(), exact: true, icon: Home },
          { label: 'Avisos', path: '/notifications', exact: true, icon: Bell, badge: () => this.unreadNotificationCount() },
        ];
    }
  });

  constructor() {
    void this.platformSettingsApi.ensureLoaded();

    effect(() => {
      this.headerImageUrl();
      this.headerImageFailed.set(false);
    });

    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.notificationInbox.refreshUnreadCount();
      } else {
        this.notificationInbox.clearLocalState();
      }
    });

    if (this.authService.getCurrentRole() === 'Restaurant') {
      this.myBusinessApi
        .getMyBusiness()
        .pipe(takeUntilDestroyed())
        .subscribe({ error: () => undefined });
    }

    if (this.router.url === '/' || this.router.url === '') {
      void this.router.navigateByUrl(this.authService.getDefaultRoute());
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  markBrandingLogoFailed(): void {
    this.brandingLogoFailed.set(true);
  }

  markHeaderImageFailed(): void {
    this.headerImageFailed.set(true);
  }
}

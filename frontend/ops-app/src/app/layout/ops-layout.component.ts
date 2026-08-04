import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PlatformSettingsApiService } from '../core/services/platform-settings-api.service';
import { MobilePageShellComponent } from '../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../shared/components/status-badge.component';

interface NavItem {
  label: string;
  path: string;
  helper?: string;
  exact?: boolean;
}

@Component({
  selector: 'app-ops-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StatusBadgeComponent, MobilePageShellComponent],
  template: `
    <div class="grid min-h-dvh bg-slate-50 xl:grid-cols-[304px_minmax(0,1fr)]">
      <header class="sticky top-0 z-50 border-b border-slate-200/80 bg-slate-50/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top,0px))] backdrop-blur xl:hidden">
        <div class="flex min-w-0 items-center justify-between gap-3">
          <a class="flex min-w-0 items-center gap-3 text-slate-950 no-underline" [routerLink]="defaultRoute()">
            @if (branding()?.logoUrl && !brandingLogoFailed()) {
              <img
                class="h-9 w-9 shrink-0 rounded-2xl object-contain"
                [src]="branding()!.logoUrl!"
                alt=""
                aria-hidden="true"
                (error)="markBrandingLogoFailed()"
              />
            } @else {
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary-700 text-xs font-black text-white shadow-lg shadow-primary-700/20">AP</span>
            }
            <span class="min-w-0">
              <strong class="block truncate text-sm font-black leading-5">{{ navHeading() }}</strong>
              <small class="block truncate text-xs font-semibold text-slate-500">
                {{ currentUser()?.fullName || currentUser()?.email || 'Operador' }}
              </small>
            </span>
          </a>

          <button
            class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-primary-700 shadow-sm transition active:scale-[0.98]"
            type="button"
            (click)="logout()"
          >
            Salir
          </button>
        </div>
      </header>

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
            <div class="grid gap-1">
              <span class="text-[0.76rem] font-black uppercase tracking-[0.08em] text-slate-500">Sesión activa</span>
              <strong class="text-base text-loreto-carbon">{{ currentUser()?.fullName || 'Operador' }}</strong>
              <small class="text-sm text-text-muted">{{ currentUser()?.email || 'Sin email' }}</small>
            </div>
            <app-status-badge [status]="currentUser()?.role" prefix="Rol" />
          </div>

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
          [bottomSpacingClass]="'pb-[calc(96px+env(safe-area-inset-bottom,0px))]'"
          [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'"
          [extraClass]="'px-3 md:px-4 xl:px-6'"
        >
          <router-outlet />
        </app-mobile-page-shell>
      </main>

      <nav class="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.10)] backdrop-blur xl:hidden" aria-label="Navegación operativa móvil">
        <div class="mx-auto grid max-w-[520px] grid-cols-5 gap-1">
          @for (item of mobileNavItems(); track item.path) {
            <a
              routerLinkActive="text-primary-700"
              [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
              [routerLink]="item.path"
              class="group flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-center text-[0.68rem] font-black leading-tight text-slate-500 no-underline transition active:scale-[0.98]"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-slate-300 transition group-[.text-primary-700]:w-5 group-[.text-primary-700]:bg-primary-700"></span>
              <span class="line-clamp-2">{{ item.label }}</span>
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

  readonly currentUser = computed(() => this.authService.currentUser());
  readonly defaultRoute = computed(() => this.authService.getDefaultRoute());
  readonly branding = this.platformSettingsApi.settings;
  readonly brandingLogoFailed = signal(false);
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

  readonly navItems = computed<NavItem[]>(() => {
    const role = this.authService.getCurrentRole();

    switch (role) {
      case 'Restaurant':
        return [
          { label: 'Inicio', path: '/business/dashboard', helper: 'Estado y resumen' },
          { label: 'Pedidos', path: '/business/orders', helper: 'Preparación y pickup', exact: false },
          { label: 'Perfil', path: '/business/profile', helper: 'Visibilidad pública' },
          { label: 'Categorías', path: '/business/menu/categories', helper: 'Organiza catálogo' },
          { label: 'Productos', path: '/business/menu/items', helper: 'Disponibilidad' },
          { label: 'Favores', path: '/community', helper: 'Solicitudes y trayectos', exact: false },
        ];
      case 'Driver':
        return [
          { label: 'Inicio', path: '/driver/dashboard', helper: 'Estado operativo' },
          { label: 'Pedidos disponibles', path: '/driver/orders', helper: 'Listos para tomar' },
          { label: 'Pedido activo', path: '/driver/active-order', helper: 'Entrega en curso', exact: false },
          { label: 'Mis pedidos', path: '/driver/orders/my', helper: 'Historial operativo', exact: false },
          { label: 'Favores', path: '/community', helper: 'Red distribuida', exact: false },
        ];
      case 'Admin':
        return [
          { label: 'Inicio', path: '/admin/dashboard', helper: 'Pendientes clave' },
          { label: 'Favores', path: '/admin/community', helper: 'Colaboradores y métricas', exact: false },
          { label: 'Marca', path: '/admin/settings/branding', helper: 'Logo, icono y splash' },
          { label: 'Pagos', path: '/admin/payments', helper: 'Yape y Plin pendientes', exact: false },
          { label: 'Categorías de negocios', path: '/admin/business-types', helper: 'Tipos, iconos y estado' },
          { label: 'Negocios pendientes', path: '/admin/businesses/pending', helper: 'Aprobar o rechazar' },
          { label: 'Drivers pendientes', path: '/admin/drivers/pending', helper: 'Aprobar o rechazar' },
          { label: 'Todos los negocios', path: '/admin/businesses', helper: 'Estados y detalle', exact: false },
          { label: 'Todos los drivers', path: '/admin/drivers', helper: 'Estados y detalle', exact: false },
        ];
      default:
        return [{ label: 'Favores', path: '/community', helper: 'Solicitudes y trayectos', exact: false }];
    }
  });

  readonly mobileNavItems = computed<NavItem[]>(() => {
    const role = this.authService.getCurrentRole();

    switch (role) {
      case 'Restaurant':
        return [
          { label: 'Inicio', path: '/business/dashboard', exact: true },
          { label: 'Pedidos', path: '/business/orders', exact: false },
          { label: 'Productos', path: '/business/menu/items', exact: false },
          { label: 'Perfil', path: '/business/profile', exact: false },
          { label: 'Favores', path: '/community', exact: false },
        ];
      case 'Driver':
        return [
          { label: 'Inicio', path: '/driver/dashboard', exact: true },
          { label: 'Disponibles', path: '/driver/orders', exact: true },
          { label: 'Activo', path: '/driver/active-order', exact: false },
          { label: 'Historial', path: '/driver/orders/my', exact: false },
          { label: 'Favores', path: '/community', exact: false },
        ];
      case 'Admin':
        return [
          { label: 'Inicio', path: '/admin/dashboard', exact: true },
          { label: 'Pagos', path: '/admin/payments', exact: false },
          { label: 'Negocios', path: '/admin/businesses', exact: false },
          { label: 'Drivers', path: '/admin/drivers', exact: false },
          { label: 'Marca', path: '/admin/settings/branding', exact: false },
        ];
      default:
        return [
          { label: 'Inicio', path: this.authService.getDefaultRoute(), exact: true },
          { label: 'Favores', path: '/community', exact: false },
        ];
    }
  });

  constructor() {
    void this.platformSettingsApi.ensureLoaded();

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
}

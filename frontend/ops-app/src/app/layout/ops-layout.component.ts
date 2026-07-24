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
}

@Component({
  selector: 'app-ops-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StatusBadgeComponent, MobilePageShellComponent],
  template: `
    <div class="grid min-h-dvh bg-slate-50 xl:grid-cols-[304px_minmax(0,1fr)]">
      <aside class="z-20 flex flex-col gap-3 border-b border-slate-200 bg-white/95 px-3 pb-3 pt-[max(12px,env(safe-area-inset-top,0px))] backdrop-blur xl:sticky xl:top-0 xl:h-screen xl:justify-between xl:gap-5 xl:overflow-y-auto xl:border-r xl:border-b-0 xl:bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.12),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] xl:p-4 xl:backdrop-blur-0">
        <div class="grid gap-3 xl:gap-4">
          <a class="hidden items-center text-primary-900 no-underline md:flex" [routerLink]="defaultRoute()">
            @if (branding()?.logoUrl && !brandingLogoFailed()) {
              <img class="block h-16 w-auto max-w-[260px] object-contain xl:h-20 xl:max-w-[320px]" [src]="branding()!.logoUrl!" alt="" aria-hidden="true" (error)="markBrandingLogoFailed()" />
            } @else {
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-lg shadow-primary-700/20">AP</span>
            }
            @if (!branding()?.logoUrl || brandingLogoFailed()) {
              <span class="pl-3 text-[1.25rem] font-black tracking-[-0.04em]">
                {{ branding()?.appName || 'AppuraPe' }}
                <small class="block text-xs font-bold tracking-normal text-text-muted">{{ branding()?.tagline || (branding()?.appName || 'AppuraPe') }}</small>
              </span>
            }
          </a>

          <div class="hidden gap-2 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_auto] md:items-center xl:grid xl:grid-cols-1 xl:items-start">
            <div class="grid gap-1">
              <span class="text-[0.76rem] font-black uppercase tracking-[0.08em] text-slate-500">Sesión activa</span>
              <strong class="text-base text-loreto-carbon">{{ currentUser()?.fullName || 'Operador' }}</strong>
              <small class="text-sm text-text-muted">{{ currentUser()?.email || 'Sin email' }}</small>
            </div>
            <app-status-badge [status]="currentUser()?.role" prefix="Rol" />
          </div>

          <div class="hidden px-1 text-[0.76rem] font-black uppercase tracking-[0.08em] text-slate-500 xl:block">{{ navHeading() }}</div>
          <nav class="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:mx-0 xl:grid xl:gap-2 xl:overflow-visible xl:px-0 xl:pb-0">
            @for (item of navItems(); track item.path) {
              <a
                routerLinkActive="active-link"
                [routerLinkActiveOptions]="{ exact: true }"
                [routerLink]="item.path"
                class="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-bold text-slate-700 no-underline shadow-sm transition hover:border-slate-200 hover:bg-white hover:text-primary-700 xl:grid xl:min-h-[54px] xl:min-w-0 xl:flex-none xl:justify-start xl:gap-1 xl:rounded-2xl xl:border-transparent xl:bg-white/70 xl:px-4 xl:py-3 xl:text-base xl:font-extrabold xl:text-text-muted"
              >
                <span>{{ item.label }}</span>
                @if (item.helper) {
                  <small class="hidden text-xs font-medium xl:block">{{ item.helper }}</small>
                }
              </a>
            }
          </nav>
        </div>

        <button class="button secondary w-full min-h-11 rounded-2xl xl:sticky xl:bottom-4" type="button" (click)="logout()">Cerrar sesión</button>
      </aside>

      <main class="min-w-0 overflow-x-hidden">
        <app-mobile-page-shell
          [backgroundClass]="'bg-slate-50'"
          [bottomSpacingClass]="'pb-6'"
          [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'"
          [extraClass]="'px-3 md:px-4 xl:px-6'"
        >
          <router-outlet />
        </app-mobile-page-shell>
      </main>
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
          { label: 'Dashboard', path: '/business/dashboard', helper: 'Estado y resumen' },
          { label: 'Pedidos', path: '/business/orders', helper: 'Preparación y pickup' },
          { label: 'Perfil', path: '/business/profile', helper: 'Visibilidad pública' },
          { label: 'Categorías', path: '/business/menu/categories', helper: 'Organiza catálogo' },
          { label: 'Productos', path: '/business/menu/items', helper: 'Disponibilidad' },
          { label: 'Favores', path: '/community', helper: 'Solicitudes y trayectos' },
        ];
      case 'Driver':
        return [
          { label: 'Dashboard', path: '/driver/dashboard', helper: 'Estado operativo' },
          { label: 'Pedidos disponibles', path: '/driver/orders', helper: 'Listos para tomar' },
          { label: 'Pedido activo', path: '/driver/active-order', helper: 'Entrega en curso' },
          { label: 'Mis pedidos', path: '/driver/orders/my', helper: 'Historial operativo' },
          { label: 'Comunidad', path: '/community', helper: 'Red distribuida' },
        ];
      case 'Admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', helper: 'Pendientes clave' },
          { label: 'Comunidad', path: '/admin/community', helper: 'Colaboradores y métricas' },
          { label: 'Branding', path: '/admin/settings/branding', helper: 'Logo, icono y splash' },
          { label: 'Pagos', path: '/admin/payments', helper: 'Yape y Plin pendientes' },
          { label: 'Categorías de negocios', path: '/admin/business-types', helper: 'Tipos, iconos y estado' },
          { label: 'Negocios pendientes', path: '/admin/restaurants/pending', helper: 'Aprobar o rechazar' },
          { label: 'Drivers pendientes', path: '/admin/drivers/pending', helper: 'Aprobar o rechazar' },
          { label: 'Todos los negocios', path: '/admin/restaurants', helper: 'Estados y detalle' },
          { label: 'Todos los drivers', path: '/admin/drivers', helper: 'Estados y detalle' },
        ];
      default:
        return [{ label: 'Comunidad', path: '/community', helper: 'Solicitudes y trayectos' }];
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

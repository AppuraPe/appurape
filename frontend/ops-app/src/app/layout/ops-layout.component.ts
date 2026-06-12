import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { PlatformSettingsApiService } from '../core/services/platform-settings-api.service';
import { StatusBadgeComponent } from '../shared/components/status-badge.component';

interface NavItem {
  label: string;
  path: string;
  helper?: string;
}

@Component({
  selector: 'app-ops-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, StatusBadgeComponent],
  template: `
    <div class="grid min-h-screen xl:grid-cols-[304px_minmax(0,1fr)]">
      <aside class="z-20 flex flex-col gap-4 border-b border-[#eddad4] bg-[linear-gradient(180deg,#ffffff_0%,#fff7f5_100%)] p-3 xl:sticky xl:top-0 xl:h-screen xl:justify-between xl:gap-5 xl:overflow-y-auto xl:border-r xl:border-b-0 xl:bg-[radial-gradient(circle_at_top_left,rgba(229,27,35,0.14),transparent_32%),linear-gradient(180deg,#ffffff_0%,#fff3f2_100%)] xl:p-4">
        <div class="grid gap-3 xl:gap-4">
          <a class="hidden items-center text-primary-900 no-underline md:flex" [routerLink]="defaultRoute()">
            @if (branding()?.logoUrl) {
              <img class="block h-16 w-auto max-w-[260px] object-contain xl:h-20 xl:max-w-[320px]" [src]="branding()!.logoUrl!" [alt]="branding()?.appName || 'AppuraPe'" />
            } @else {
              <span class="grid h-11 w-11 place-items-center rounded-2xl bg-primary-700 text-sm font-black text-white shadow-lg shadow-primary-700/20">AP</span>
            }
            @if (!branding()?.logoUrl) {
              <span class="pl-3 text-[1.25rem] font-black tracking-[-0.04em]">
                {{ branding()?.appName || 'AppuraPe' }}
                <small class="block text-xs font-bold tracking-normal text-text-muted">{{ branding()?.tagline || (branding()?.appName || 'AppuraPe') }}</small>
              </span>
            }
          </a>

          <div class="hidden gap-2 rounded-[22px] border border-[#eddad4] bg-white/90 p-4 shadow-soft md:grid-cols-[minmax(0,1fr)_auto] md:items-center xl:grid xl:grid-cols-1 xl:items-start">
            <div class="grid gap-1">
              <span class="text-[0.76rem] font-black uppercase tracking-[0.08em] text-text-muted">Sesion activa</span>
              <strong class="text-base text-loreto-carbon">{{ currentUser()?.fullName || 'Operador' }}</strong>
              <small class="text-sm text-text-muted">{{ currentUser()?.email || 'Sin email' }}</small>
            </div>
            <app-status-badge [status]="currentUser()?.role" prefix="Rol" />
          </div>

          <div class="hidden px-1 text-[0.76rem] font-black uppercase tracking-[0.08em] text-text-muted xl:block">{{ navHeading() }}</div>
          <nav class="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 xl:mx-0 xl:grid xl:gap-2 xl:overflow-visible xl:px-0 xl:pb-0">
            @for (item of navItems(); track item.path) {
              <a
                routerLinkActive="active-link"
                [routerLinkActiveOptions]="{ exact: true }"
                [routerLink]="item.path"
                class="grid min-h-[48px] min-w-[10.5rem] shrink-0 gap-1 rounded-2xl border border-transparent px-4 py-2.5 font-extrabold text-text-muted no-underline transition hover:border-[#eddad4] hover:bg-white hover:text-primary-700 md:min-w-[12rem] xl:min-h-[54px] xl:min-w-0 xl:flex-none xl:px-4 xl:py-3"
              >
                <span>{{ item.label }}</span>
                @if (item.helper) {
                  <small class="hidden text-xs font-medium xl:block">{{ item.helper }}</small>
                }
              </a>
            }
          </nav>
        </div>

        <button class="button secondary w-full min-h-11 xl:sticky xl:bottom-4" type="button" (click)="logout()">Cerrar sesion</button>
      </aside>

      <main class="min-w-0 overflow-x-hidden p-3 md:p-4 xl:p-6">
        <router-outlet />
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
          { label: 'Favores', path: '/favors', helper: 'Solicitudes y trayectos' },
        ];
      case 'Driver':
        return [
          { label: 'Dashboard', path: '/driver/dashboard', helper: 'Estado operativo' },
          { label: 'Pedidos disponibles', path: '/driver/orders/available', helper: 'Listos para tomar' },
          { label: 'Mis pedidos', path: '/driver/orders/my', helper: 'Siguiente acción' },
          { label: 'Comunidad', path: '/community', helper: 'Red distribuida' },
        ];
      case 'Admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard', helper: 'Pendientes clave' },
          { label: 'Comunidad', path: '/admin/community', helper: 'Colaboradores y métricas' },
          { label: 'Branding', path: '/admin/settings/branding', helper: 'Logo, icono y splash' },
          { label: 'Negocios pendientes', path: '/admin/restaurants/pending', helper: 'Aprobar o rechazar' },
          { label: 'Drivers pendientes', path: '/admin/drivers/pending', helper: 'Aprobar o rechazar' },
          { label: 'Todos los negocios', path: '/admin/restaurants', helper: 'Estados y detalle' },
          { label: 'Todos los drivers', path: '/admin/drivers', helper: 'Estados y detalle' },
        ];
      default:
        return [
          { label: 'Comunidad', path: '/community', helper: 'Solicitudes y trayectos' },
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
}

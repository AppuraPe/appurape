import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  Bike,
  CheckCircle2,
  ChevronRight,
  Headphones,
  HeartHandshake,
  LogOut,
  LucideAngularModule,
  Phone,
  ShieldCheck,
  Star,
  Tags,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { PlatformSettingsApiService } from '../../core/services/platform-settings-api.service';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { ProfileModeSwitcherCardComponent } from '../../shared/components/profile-mode-switcher-card.component';

@Component({
  selector: 'app-driver-profile-page',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    ProfileModeSwitcherCardComponent,
  ],
  template: `
    <app-mobile-page-shell
      [bottomSpacingClass]="'pb-4'"
      [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'"
      [extraClass]="'grid w-full min-w-0 max-w-3xl content-start gap-4 overflow-x-hidden pt-2 px-2'"
    >
      <header class="px-1">
        <span class="text-[10px] font-black uppercase tracking-[0.14em] text-primary-700">Mi Cuenta</span>
        <h1 class="text-xl font-black tracking-tight text-slate-950">Perfil de Repartidor</h1>
        <p class="text-xs text-slate-500">Datos de tu cuenta, nivel de confianza y accesos rápidos.</p>
      </header>

      <!-- Modo de uso / Switcher -->
      <app-profile-mode-switcher-card class="block w-full min-w-0 max-w-full" />

      <!-- TARJETA DE IDENTIDAD DEL DRIVER -->
      <app-surface-card variant="hero" extraClass="w-full min-w-0 max-w-full p-4 sm:p-5">
        <div class="flex items-center gap-3.5">
          <div class="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-primary-700 text-xl font-black uppercase text-white shadow-md shadow-primary-700/20">
            {{ initials() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <strong class="truncate text-lg font-black tracking-tight text-slate-950">{{ user()?.fullName || 'Repartidor' }}</strong>
            </div>
            <p class="truncate text-xs font-semibold text-primary-700">Repartidor Oficial AppuraPe</p>
            <p class="mt-0.5 truncate text-xs text-slate-500">{{ user()?.email }}</p>
          </div>
        </div>
      </app-surface-card>

      <!-- TARJETA DE CONFIANZA Y NIVEL -->
      <section class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Nivel de Confianza">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <lucide-angular class="h-5 w-5" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
            </div>
            <div>
              <p class="text-xs font-black uppercase tracking-wider text-slate-500">Nivel de Confianza</p>
              <strong class="text-sm font-black text-slate-900">{{ trustLevelLabel() }}</strong>
            </div>
          </div>
          <span class="rounded-2xl bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800 tabular-nums">
            {{ trustScore() }}% Score
          </span>
        </div>
        <p class="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          {{ trustLevelHint() }}
        </p>
      </section>

      <!-- ACCESOS RÁPIDOS -->
      <section class="grid gap-2" aria-label="Accesos Rápidos">
        <p class="px-1 text-xs font-black uppercase tracking-wider text-slate-500">Accesos y Operaciones</p>
        
        <div class="grid gap-2 sm:grid-cols-2">
          <a
            routerLink="/driver/orders/my"
            class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 no-underline shadow-sm transition hover:border-primary-300 active:scale-[0.99]"
          >
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-700">
                <lucide-angular class="h-5 w-5" [img]="tagsIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div>
                <strong class="block text-sm font-extrabold">Historial de Entregas</strong>
                <span class="text-xs text-slate-500">Revisa pedidos pasados</span>
              </div>
            </div>
            <lucide-angular class="h-4 w-4 text-slate-400" [img]="chevronRightIcon" aria-hidden="true"></lucide-angular>
          </a>

          <a
            routerLink="/driver/orders"
            class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 no-underline shadow-sm transition hover:border-emerald-300 active:scale-[0.99]"
          >
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <lucide-angular class="h-5 w-5" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div>
                <strong class="block text-sm font-extrabold">Pedidos Disponibles</strong>
                <span class="text-xs text-slate-500">Tomar nuevos pedidos</span>
              </div>
            </div>
            <lucide-angular class="h-4 w-4 text-slate-400" [img]="chevronRightIcon" aria-hidden="true"></lucide-angular>
          </a>

          @if (supportHref()) {
            <a
              [href]="supportHref()!"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-800 no-underline shadow-sm transition hover:border-sky-300 active:scale-[0.99]"
            >
              <div class="flex items-center gap-3">
                <div class="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700">
                  <lucide-angular class="h-5 w-5" [img]="headphonesIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div>
                  <strong class="block text-sm font-extrabold">Soporte Operativo</strong>
                  <span class="text-xs text-slate-500">Ayuda por WhatsApp</span>
                </div>
              </div>
              <lucide-angular class="h-4 w-4 text-slate-400" [img]="chevronRightIcon" aria-hidden="true"></lucide-angular>
            </a>
          }
        </div>
      </section>

      <!-- BOTÓN CERRAR SESIÓN -->
      <div class="pt-2">
        <button
          type="button"
          (click)="logout()"
          class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 shadow-sm transition active:scale-[0.98] hover:bg-rose-100"
        >
          <lucide-angular class="h-4 w-4" [img]="logoutIcon" aria-hidden="true"></lucide-angular>
          Cerrar sesión
        </button>
      </div>
    </app-mobile-page-shell>
  `,
})
export class DriverProfilePageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);

  readonly shieldCheckIcon = ShieldCheck;
  readonly tagsIcon = Tags;
  readonly communityIcon = HeartHandshake;
  readonly headphonesIcon = Headphones;
  readonly chevronRightIcon = ChevronRight;
  readonly logoutIcon = LogOut;

  readonly user = computed(() => this.authService.currentUser());
  readonly supportHref = computed(() => {
    const raw = this.platformSettingsApi.settings()?.supportPhone?.trim();
    if (!raw) return null;
    const phone = raw.replace(/\D/g, '');
    const fullPhone = phone.length === 9 ? `51${phone}` : phone;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent('Hola Soporte AppuraPe, necesito ayuda con mi cuenta de repartidor.')}`;
  });

  readonly initials = computed(() => {
    const name = this.user()?.fullName?.trim() || 'Repartidor';
    const words = name.split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase() || 'DR';
  });

  trustLevelLabel(): string {
    const trustLevel = this.user()?.trustLevel;
    switch (trustLevel) {
      case 'Trusted':
        return 'Repartidor de Confianza';
      case 'Verified':
        return 'Repartidor Verificado';
      default:
        return 'En Aprobación';
    }
  }

  trustLevelHint(): string {
    const trustLevel = this.user()?.trustLevel;
    if (trustLevel === 'Trusted') {
      return 'Cuentas con la máxima prioridad para asignación de pedidos y comisiones especiales.';
    }
    if (trustLevel === 'Verified') {
      return 'Tus documentos están verificados y operas como repartidor activo en toda la red.';
    }
    return 'Tu cuenta está en revisión o en proceso de verificación por la administración.';
  }

  trustScore(): number {
    return this.user()?.trustScore ?? 100;
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}

import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import {
  ChevronRight,
  CircleUserRound,
  Headphones,
  HeartHandshake,
  LockKeyhole,
  LogOut,
  LucideAngularModule,
  MapPin,
  PackageCheck,
  ShieldCheck,
} from 'lucide-angular';
import { CustomerAddressResponse } from '../../core/models/customer-addresses.models';
import { AuthService } from '../../core/services/auth.service';
import { CustomerAddressesApiService } from '../../core/services/customer-addresses-api.service';
import { PlatformSettingsApiService } from '../../core/services/platform-settings-api.service';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';

@Component({
  selector: 'app-customer-profile-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    RouterLink,
    MobilePageShellComponent,
    AppSurfaceCardComponent,
    AppButtonComponent,
  ],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      [desktopClass]="'md:mx-auto md:max-w-4xl md:px-6 lg:max-w-5xl lg:px-0 lg:pb-12'"
      [extraClass]="'box-border grid w-full max-w-full gap-3.5 overflow-x-hidden px-4 pt-4 md:gap-4 md:pt-6'"
    >
      <header class="box-border grid w-full min-w-0 max-w-full gap-1.5 px-0.5">
        <span class="text-[11px] font-bold uppercase tracking-[0.06em] text-primary-700">Mi cuenta</span>
        <h1 class="text-2xl font-extrabold leading-tight tracking-[-0.03em] text-slate-950">Perfil</h1>
        <p class="text-sm leading-5 text-slate-500">Tus datos y accesos frecuentes.</p>
      </header>

      <app-surface-card class="block w-full min-w-0 max-w-full box-border" variant="hero" extraClass="box-border w-full min-w-0 max-w-full overflow-hidden !p-4">
        <div class="flex w-full min-w-0 max-w-full items-center gap-3">
          <div class="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-primary-700 text-lg font-extrabold text-white shadow-sm">
            {{ initials() }}
          </div>
          <div class="min-w-0 max-w-full flex-1 overflow-hidden">
            <p class="truncate text-base font-extrabold tracking-[-0.02em] text-slate-950">{{ user()?.fullName || 'Usuario de AppuraPe' }}</p>
            <p class="mt-0.5 truncate text-[13px] font-semibold text-primary-700">Cliente AppuraPe</p>
            <p class="mt-0.5 max-w-full truncate text-xs text-slate-500">{{ user()?.email }}</p>
          </div>
        </div>
      </app-surface-card>

      <section class="box-border w-full min-w-0 max-w-full" aria-labelledby="quick-actions-title">
        <h2 id="quick-actions-title" class="mb-2 text-[15px] font-bold text-slate-950">Accesos rápidos</h2>
        <div class="grid w-full min-w-0 max-w-full grid-cols-[repeat(2,minmax(0,1fr))] gap-2 sm:gap-3">
          <a class="box-border flex h-16 w-full min-w-0 max-w-full items-center gap-2 rounded-[15px] border border-slate-200 bg-white px-2.5 py-3 text-[13px] font-semibold text-slate-700 no-underline shadow-sm" routerLink="/orders">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-primary-50 text-primary-700">
              <lucide-angular class="h-5 w-5" [img]="ordersIcon" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1 truncate">Pedidos</span>
          </a>
          <a class="box-border flex h-16 w-full min-w-0 max-w-full items-center gap-2 rounded-[15px] border border-slate-200 bg-white px-2.5 py-3 text-[13px] font-semibold text-slate-700 no-underline shadow-sm" routerLink="/account/addresses">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-primary-50 text-primary-700">
              <lucide-angular class="h-5 w-5" [img]="addressIcon" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1 truncate">Direcciones</span>
          </a>
          <a class="box-border flex h-16 w-full min-w-0 max-w-full items-center gap-2 rounded-[15px] border border-slate-200 bg-white px-2.5 py-3 text-[13px] font-semibold text-slate-700 no-underline shadow-sm" routerLink="/community">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-primary-50 text-primary-700">
              <lucide-angular class="h-5 w-5" [img]="communityIcon" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1 truncate">Favores</span>
          </a>
          @if (supportHref()) {
            <a class="box-border flex h-16 w-full min-w-0 max-w-full items-center gap-2 rounded-[15px] border border-slate-200 bg-white px-2.5 py-3 text-[13px] font-semibold text-slate-700 no-underline shadow-sm" [href]="supportHref()!">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-primary-50 text-primary-700">
                <lucide-angular class="h-5 w-5" [img]="supportIcon" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1 truncate">Soporte</span>
            </a>
          } @else {
            <span class="box-border flex h-16 w-full min-w-0 max-w-full items-center gap-2 rounded-[15px] border border-slate-200 bg-white px-2.5 py-3 text-[13px] font-semibold text-slate-700 shadow-sm" aria-disabled="true">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-slate-100 text-slate-600">
                <lucide-angular class="h-5 w-5" [img]="supportIcon" aria-hidden="true" />
              </span>
              <span class="min-w-0 flex-1 truncate">Soporte</span>
            </span>
          }
        </div>
      </section>

      <app-surface-card class="block w-full min-w-0 max-w-full box-border" variant="default" extraClass="box-border w-full min-w-0 max-w-full overflow-hidden p-0 !shadow-none sm:p-0">
        <div class="flex w-full min-w-0 max-w-full items-center justify-between gap-3 border-b border-slate-100/70 px-4 py-3">
          <div class="min-w-0 flex-1 overflow-hidden">
            <p class="text-sm font-black text-slate-950">Datos personales</p>
            <p class="mt-0.5 truncate text-xs text-slate-500">Información usada en tus pedidos</p>
          </div>
          <span class="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Protegidos</span>
        </div>
        <dl class="w-full min-w-0 max-w-full overflow-hidden divide-y divide-slate-100/70">
          <div class="flex w-full min-w-0 max-w-full items-center gap-3 px-4 py-2.5">
            <lucide-angular class="h-[18px] w-[18px] shrink-0 text-slate-400" [img]="profileIcon" aria-hidden="true" />
            <div class="min-w-0 max-w-full flex-1 overflow-hidden">
              <dt class="text-xs font-semibold text-slate-500">Nombre</dt>
              <dd class="block max-w-full truncate text-sm font-bold text-slate-950">{{ user()?.fullName || 'Sin nombre registrado' }}</dd>
            </div>
          </div>
          <div class="flex w-full min-w-0 max-w-full items-center gap-3 px-4 py-2.5">
            <lucide-angular class="h-[18px] w-[18px] shrink-0 text-slate-400" [img]="securityIcon" aria-hidden="true" />
            <div class="min-w-0 max-w-full flex-1 overflow-hidden">
              <dt class="text-xs font-semibold text-slate-500">Correo</dt>
              <dd class="block max-w-full truncate text-sm font-bold text-slate-950">{{ user()?.email }}</dd>
            </div>
          </div>
          <div class="flex w-full min-w-0 max-w-full items-center gap-3 px-4 py-2.5">
            <lucide-angular class="h-[18px] w-[18px] shrink-0 text-slate-400" [img]="addressIcon" aria-hidden="true" />
            <div class="min-w-0 max-w-full flex-1 overflow-hidden">
              <dt class="text-xs font-semibold text-slate-500">Celular de entrega</dt>
              <dd class="block max-w-full truncate text-sm font-bold text-slate-950">{{ primaryPhone() }}</dd>
            </div>
          </div>
        </dl>
      </app-surface-card>

      <app-surface-card class="block w-full min-w-0 max-w-full box-border" variant="default" extraClass="box-border w-full min-w-0 max-w-full overflow-hidden p-0 sm:p-0">
        <a routerLink="/account/addresses" class="flex min-h-14 w-full min-w-0 max-w-full items-center gap-3 px-4 py-3 text-slate-950 no-underline">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
            <lucide-angular class="h-5 w-5" [img]="addressIcon" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-sm">Dirección principal</strong>
            <small class="block truncate text-xs text-slate-500">{{ primaryAddressLine() }}</small>
          </span>
          <lucide-angular class="h-4 w-4 text-slate-400" [img]="chevronIcon" aria-hidden="true" />
        </a>
      </app-surface-card>

      <app-surface-card class="block w-full min-w-0 max-w-full box-border" variant="default" extraClass="box-border w-full min-w-0 max-w-full overflow-hidden p-0 sm:p-0">
        <div class="w-full min-w-0 max-w-full border-b border-slate-100 px-4 py-3">
          <h2 class="text-[15px] font-bold text-slate-950">Cuenta y seguridad</h2>
        </div>
        <a routerLink="/forgot-password" class="flex min-h-14 w-full min-w-0 max-w-full items-center gap-3 px-4 py-2.5 text-slate-950 no-underline">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <lucide-angular class="h-5 w-5" [img]="passwordIcon" aria-hidden="true" />
          </span>
          <span class="min-w-0 flex-1">
            <strong class="block text-sm">Seguridad</strong>
            <small class="block truncate text-xs text-slate-500">Restablece tu contraseña</small>
          </span>
          <lucide-angular class="h-4 w-4 text-slate-400" [img]="chevronIcon" aria-hidden="true" />
        </a>
        <div class="w-full min-w-0 max-w-full border-t border-slate-100 px-4 py-2.5">
          <app-button variant="ghost" size="sm" (click)="logout()">
            <lucide-angular class="h-4 w-4" [img]="logoutIcon" aria-hidden="true" />
            Cerrar sesión
          </app-button>
        </div>
        <a routerLink="/account-deletion" class="flex min-h-12 w-full items-center border-t border-slate-100 px-4 py-3 text-sm font-bold text-red-700 no-underline">Solicitar eliminación de cuenta</a>
      </app-surface-card>

      <p class="w-full min-w-0 max-w-full pb-3 text-center text-xs text-slate-400">AppuraPe · Cuenta protegida</p>
    </app-mobile-page-shell>
  `,
})
export class CustomerProfilePageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly addressesApi = inject(CustomerAddressesApiService);
  private readonly platformSettingsApi = inject(PlatformSettingsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.currentUser;
  readonly addresses = signal<CustomerAddressResponse[]>([]);
  readonly primaryAddress = computed(() => this.addresses().find((address) => address.isDefault) ?? this.addresses()[0] ?? null);
  readonly primaryPhone = computed(() => this.primaryAddress()?.recipientPhone || 'Aún no registrado');
  readonly primaryAddressLine = computed(() => this.primaryAddress()?.addressLine || 'Agrega tu primera dirección');
  readonly supportHref = computed(() => {
    const settings = this.platformSettingsApi.settings();
    const supportPhone = settings?.supportPhone?.trim();
    const supportEmail = settings?.supportEmail?.trim();

    if (supportPhone) {
      return `tel:${supportPhone.replace(/[^+\d]/g, '')}`;
    }

    return supportEmail ? `mailto:${supportEmail}` : null;
  });
  readonly initials = computed(() => {
    const name = this.user()?.fullName?.trim();
    if (!name) {
      return 'AP';
    }

    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  });

  readonly ordersIcon = PackageCheck;
  readonly addressIcon = MapPin;
  readonly communityIcon = HeartHandshake;
  readonly supportIcon = Headphones;
  readonly profileIcon = CircleUserRound;
  readonly securityIcon = ShieldCheck;
  readonly passwordIcon = LockKeyhole;
  readonly chevronIcon = ChevronRight;
  readonly logoutIcon = LogOut;

  constructor() {
    this.addressesApi
      .getMyAddresses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (addresses) => this.addresses.set(addresses.filter((address) => address.isActive)),
        error: () => this.addresses.set([]),
      });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}

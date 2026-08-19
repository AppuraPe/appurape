import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowLeftRight, Check, Sparkles, Loader2 } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { AppProfile } from '../../core/models/auth.models';
import { getDefaultRouteForProfile, getProfileDisplayName } from '@app/shared/core/auth/role.utils';

interface ProfileOption {
  key: AppProfile;
  label: string;
  description: string;
  isActive: boolean;
  isAvailable: boolean;
  canActivate: boolean;
}

@Component({
  selector: 'app-profile-mode-switcher-card',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition">
      <!-- Header -->
      <div class="border-b border-slate-100 bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50 p-4 sm:p-5">
        <div class="flex items-center gap-3">
          <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/25">
            <i-lucide [img]="switchIcon" class="h-5 w-5"></i-lucide>
          </div>
          <div class="min-w-0">
            <h2 class="text-base font-bold text-slate-900 sm:text-lg">Modo de uso</h2>
            <p class="text-xs text-slate-500 sm:text-sm">Cambia cómo quieres usar AppuraPe con esta misma cuenta.</p>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-slate-200/70">
          <span class="text-slate-500">Estás usando AppuraPe como:</span>
          <span class="inline-flex items-center gap-1 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-800">
            <i-lucide [img]="checkIcon" class="h-3 w-3"></i-lucide>
            {{ currentProfileDisplayName() }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-3 sm:p-4">
        @if (errorMessage()) {
          <div class="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:text-sm">
            {{ errorMessage() }}
          </div>
        }

        <div class="grid gap-2.5">
          @for (option of profileOptions(); track option.key) {
            <div
              class="flex flex-col gap-2 rounded-xl border p-3 transition sm:flex-row sm:items-center sm:justify-between"
              [class.border-primary-300]="option.isActive"
              [class.bg-primary-50/30]="option.isActive"
              [class.border-slate-200]="!option.isActive"
              [class.bg-white]="!option.isActive"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-slate-900">{{ option.label }}</span>
                  @if (option.isActive) {
                    <span class="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-bold text-primary-700">
                      Activo ahora
                    </span>
                  }
                </div>
                <p class="text-xs text-slate-500">{{ option.description }}</p>
              </div>

              <div class="flex shrink-0 items-center">
                @if (option.isActive) {
                  <span class="text-xs font-semibold text-primary-700">En uso</span>
                } @else if (option.isAvailable) {
                  <button
                    type="button"
                    (click)="onSwitch(option.key)"
                    [disabled]="isSwitching()"
                    class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 active:scale-98 disabled:opacity-60 sm:w-auto"
                  >
                    @if (isSwitching() && switchingTarget() === option.key) {
                      <i-lucide [img]="loadingIcon" class="h-3.5 w-3.5 animate-spin"></i-lucide>
                      Cambiando...
                    } @else {
                      Usar como {{ option.label }}
                    }
                  </button>
                } @else if (option.canActivate) {
                  <button
                    type="button"
                    (click)="onSwitch(option.key)"
                    [disabled]="isSwitching()"
                    class="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-primary-500 active:scale-98 disabled:opacity-60 sm:w-auto"
                  >
                    @if (isSwitching() && switchingTarget() === option.key) {
                      <i-lucide [img]="loadingIcon" class="h-3.5 w-3.5 animate-spin"></i-lucide>
                      Activando...
                    } @else {
                      <i-lucide [img]="sparkleIcon" class="h-3.5 w-3.5"></i-lucide>
                      Activar y usar
                    }
                  </button>
                } @else {
                  <span class="text-xs font-medium text-slate-400">Próximamente</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ProfileModeSwitcherCardComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly switchIcon = ArrowLeftRight;
  readonly checkIcon = Check;
  readonly sparkleIcon = Sparkles;
  readonly loadingIcon = Loader2;

  readonly isSwitching = signal(false);
  readonly switchingTarget = signal<AppProfile | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly activeProfile = computed<AppProfile>(() => this.authService.getActiveProfile());
  readonly currentProfileDisplayName = computed(() => getProfileDisplayName(this.activeProfile()));
  readonly availableProfiles = computed(() => this.authService.availableProfiles());
  readonly currentUser = computed(() => this.authService.currentUser());

  readonly profileOptions = computed<ProfileOption[]>(() => {
    const active = this.activeProfile();
    const available = this.availableProfiles();
    const user = this.currentUser();

    const result: ProfileOption[] = [];

    // 1. Cliente
    const isCustomerActive = active === 'Customer';
    const isCustomerAvailable = available.includes('Customer');
    // Can activate if user is Restaurant or Driver and doesn't have Customer yet
    const canActivateCustomer = !isCustomerAvailable && (user?.role === 'Restaurant' || user?.role === 'Driver');

    result.push({
      key: 'Customer',
      label: 'Cliente',
      description: 'Pide comida, productos y solicita favores comunitarios.',
      isActive: isCustomerActive,
      isAvailable: isCustomerAvailable,
      canActivate: canActivateCustomer,
    });

    // 2. Negocio (BusinessOwner)
    if (available.includes('BusinessOwner') || user?.hasBusinessProfile || user?.primaryRole === 'Restaurant') {
      result.push({
        key: 'BusinessOwner',
        label: 'Negocio',
        description: 'Gestiona pedidos, menú y operaciones de tu comercio.',
        isActive: active === 'BusinessOwner',
        isAvailable: available.includes('BusinessOwner') || !!user?.hasBusinessProfile,
        canActivate: false,
      });
    }

    // 3. Repartidor (Driver)
    if (available.includes('Driver') || user?.hasDriverProfile || user?.primaryRole === 'Driver') {
      result.push({
        key: 'Driver',
        label: 'Repartidor',
        description: 'Acepta entregas y gestiona tus pedidos asignados.',
        isActive: active === 'Driver',
        isAvailable: available.includes('Driver') || !!user?.hasDriverProfile,
        canActivate: false,
      });
    }

    // 4. Colaborador (Collaborator)
    if (available.includes('Collaborator') || user?.hasCollaboratorProfile) {
      result.push({
        key: 'Collaborator',
        label: 'Colaborador',
        description: 'Toma favores disponibles y genera ingresos con encargos cercanos.',
        isActive: active === 'Collaborator',
        isAvailable: available.includes('Collaborator'),
        canActivate: false,
      });
    }

    // 4. Administrador (Admin)
    if (available.includes('Admin') || user?.primaryRole === 'Admin') {
      result.push({
        key: 'Admin',
        label: 'Administrador',
        description: 'Control de plataforma, comercios y pagos.',
        isActive: active === 'Admin',
        isAvailable: available.includes('Admin'),
        canActivate: false,
      });
    }

    return result;
  });

  onSwitch(targetProfile: AppProfile): void {
    if (targetProfile === this.activeProfile() || this.isSwitching()) {
      return;
    }

    this.errorMessage.set(null);
    this.isSwitching.set(true);
    this.switchingTarget.set(targetProfile);

    this.authService.switchProfile(targetProfile).subscribe({
      next: () => {
        this.isSwitching.set(false);
        this.switchingTarget.set(null);
        const destination = getDefaultRouteForProfile(targetProfile);
        void this.router.navigate([destination]);
      },
      error: (error: { error?: { message?: string }; status?: number }) => {
        this.isSwitching.set(false);
        this.switchingTarget.set(null);

        if (error.status === 401) {
          this.errorMessage.set('Tu sesión ha vencido. Inicia sesión nuevamente.');
        } else if (error.status === 403) {
          this.errorMessage.set('Este modo aún no está disponible para tu cuenta.');
        } else if (error.error?.message) {
          this.errorMessage.set(error.error.message);
        } else {
          this.errorMessage.set('No pudimos cambiar de modo. Intenta nuevamente.');
        }
      },
    });
  }
}

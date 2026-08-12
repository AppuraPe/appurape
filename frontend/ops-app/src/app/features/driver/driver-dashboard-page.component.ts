import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Bike, Bolt, Compass, LucideAngularModule, RefreshCw, ShieldCheck, Star } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';

@Component({
  selector: 'app-driver-dashboard-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    AppNoticeComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-3.5 overflow-x-hidden lg:gap-4'">
      <header class="grid gap-3 px-0.5">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <app-internal-page-section-header
            eyebrow="Repartidor"
            title="Tu ruta de hoy"
            subtitle="Encuentra un pedido o continúa la entrega que tienes activa."
          />
          <button
            type="button"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-primary-700 shadow-sm transition active:scale-95"
            [disabled]="isLoading()"
            (click)="loadDashboard()"
            aria-label="Actualizar resumen"
          >
            <lucide-angular class="h-4 w-4" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
          </button>
        </div>

        <div class="flex min-w-0 items-center gap-2 overflow-hidden">
          <span class="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
            <lucide-angular class="h-3.5 w-3.5 shrink-0" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
            <span class="truncate">{{ trustLevelLabel() }}</span>
          </span>
          <span class="shrink-0 rounded-full bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            Confianza {{ trustScore() }}%
          </span>
        </div>
      </header>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      }

      @if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando resumen del repartidor" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-[80px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5">
              <div class="flex h-full items-center gap-3">
                <div class="h-10 w-10 shrink-0 rounded-xl bg-slate-200"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="h-3 w-2/3 rounded-full bg-slate-200"></div>
                  <div class="h-2.5 w-1/2 rounded-full bg-slate-100"></div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else {
        <section class="grid grid-cols-2 gap-2" aria-label="Resumen de pedidos">
          <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
            <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Disponibles</p>
            <p class="mt-1.5 text-2xl font-black leading-none text-primary-700">{{ availableOrdersCount() }}</p>
            <p class="mt-1 text-xs text-slate-500">Para tomar ahora</p>
          </div>
          <div class="min-w-0 rounded-2xl bg-white p-3.5 shadow-sm">
            <p class="truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Mis entregas</p>
            <p class="mt-1.5 text-2xl font-black leading-none text-slate-950">{{ myOrdersCount() }}</p>
            <p class="mt-1 text-xs text-slate-500">Asignadas a ti</p>
          </div>
        </section>

        <div class="grid gap-3 md:grid-cols-2">
          <a class="flex min-w-0 items-center gap-3 rounded-2xl bg-primary-700 p-4 text-white no-underline shadow-lg shadow-primary-700/20 transition active:scale-[0.99]" routerLink="/driver/orders">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15">
              <lucide-angular class="h-5 w-5" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
            </span>
            <span class="min-w-0 flex-1">
              <strong class="block truncate text-sm font-black">Buscar pedidos</strong>
              <small class="mt-0.5 block truncate text-xs font-semibold text-white/80">Revisa los disponibles cerca de ti</small>
            </span>
          </a>

          <a class="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 no-underline shadow-sm transition active:scale-[0.99]" routerLink="/driver/active-order">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700">
              <lucide-angular class="h-5 w-5" [img]="boltIcon" aria-hidden="true"></lucide-angular>
            </span>
            <span class="min-w-0 flex-1">
              <strong class="block truncate text-sm font-black">Entrega activa</strong>
              <small class="mt-0.5 block truncate text-xs font-semibold text-slate-500">Continúa el pedido en curso</small>
            </span>
          </a>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <a class="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-bold text-slate-700 no-underline" routerLink="/driver/orders/my">
            <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="starIcon" aria-hidden="true"></lucide-angular>
            <span class="truncate">Mi historial</span>
          </a>
          <a class="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-bold text-slate-700 no-underline" routerLink="/community">
            <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="compassIcon" aria-hidden="true"></lucide-angular>
            <span class="truncate">Favores</span>
          </a>
        </div>

        <p class="px-1 text-xs leading-5 text-slate-500">{{ trustLevelHint() }}</p>
      }
    </app-mobile-page-shell>
  `,
})
export class DriverDashboardPageComponent {
  private readonly authService = inject(AuthService);
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bikeIcon = Bike;
  readonly shieldCheckIcon = ShieldCheck;
  readonly compassIcon = Compass;
  readonly boltIcon = Bolt;
  readonly starIcon = Star;
  readonly refreshIcon = RefreshCw;

  readonly availableOrdersCount = signal(0);
  readonly myOrdersCount = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly currentRole = computed(() => this.authService.currentUser()?.role ?? 'Driver');

  constructor() {
    this.loadDashboard();
  }

  trustLevelLabel(): string {
    const trustLevel = this.authService.currentUser()?.trustLevel;

    switch (trustLevel) {
      case 'Trusted':
        return 'De confianza';
      case 'Verified':
        return 'Verificado';
      default:
        return 'Sin nivel';
    }
  }

  trustLevelHint(): string {
    const trustLevel = this.authService.currentUser()?.trustLevel;

    if (trustLevel === 'Trusted') {
      return 'Recibes prioridad en la red y mejor posicionamiento operativo.';
    }

    if (trustLevel === 'Verified') {
      return 'Ya operas como colaborador aprobado dentro de AppuraPe.';
    }

    return 'Aún no tienes nivel asignado.';
  }

  trustScore(): number {
    return this.authService.currentUser()?.trustScore ?? 0;
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      availableOrders: this.driverOrdersApi.getAvailableOrders(),
      myOrders: this.driverOrdersApi.getMyOrders(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ availableOrders, myOrders }) => {
          this.availableOrdersCount.set(availableOrders.length);
          this.myOrdersCount.set(myOrders.length);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el inicio del driver.'));
          this.isLoading.set(false);
        },
      });
  }
}

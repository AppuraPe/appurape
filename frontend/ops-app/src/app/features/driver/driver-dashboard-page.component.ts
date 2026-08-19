import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Bike, Bolt, Compass, LucideAngularModule, RefreshCw, ShieldCheck, Star, MapPin, TrendingUp, Wallet, Power } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';

@Component({
  selector: 'app-driver-dashboard-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden bg-slate-50 min-h-screen',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    LucideAngularModule,
    AppNoticeComponent,
    MobilePageShellComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-4 overflow-x-hidden pt-2 px-2'">
      
      <!-- COMPACT HEADER WITH ONLINE TOGGLE -->
      <header class="flex items-center justify-between rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div class="flex items-center gap-3">
          <div class="h-11 w-11 overflow-hidden rounded-full border-2 border-primary-100 bg-primary-50 shadow-sm">
            <img src="https://ui-avatars.com/api/?name=Repartidor&background=0D8ABC&color=fff&bold=true" alt="Perfil" class="h-full w-full object-cover" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-black text-slate-800 leading-none">¡Hola, equipo!</h1>
              <span class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                {{ trustScore() }}%
              </span>
            </div>
            <p class="mt-1 text-xs font-semibold text-slate-500">{{ trustLevelLabel() }}</p>
          </div>
        </div>
        
        <button
          type="button"
          (click)="toggleOnlineStatus()"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black shadow-sm transition active:scale-95"
          [class]="isOnline() ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/30' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-300'"
        >
          <span class="h-2 w-2 rounded-full" [class]="isOnline() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
          {{ isOnline() ? 'Conectado' : 'En pausa' }}
        </button>
      </header>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      }

      @if (isLoading()) {
        <div class="grid gap-4" aria-label="Cargando resumen" aria-busy="true">
          <div class="h-44 animate-pulse rounded-3xl bg-slate-200"></div>
          <div class="flex gap-4">
             <div class="h-28 flex-1 animate-pulse rounded-3xl bg-slate-200"></div>
             <div class="h-28 flex-1 animate-pulse rounded-3xl bg-slate-200"></div>
          </div>
        </div>
      } @else {
        
        <!-- TARJETA FINANCIERA DE HOY -->
        <section class="overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 p-5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
              <lucide-angular class="h-4 w-4" [img]="trendingUpIcon" aria-hidden="true"></lucide-angular>
              Ganancias de Hoy
            </span>
            <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">En tiempo real</span>
          </div>
          <div class="mt-3 flex items-baseline justify-between">
            <p class="text-3xl font-black tracking-tight text-emerald-700 tabular-nums">
              {{ todayEarnings() | currency: 'PEN' : 'S/ ' : '1.2-2' }}
            </p>
            <p class="text-xs font-bold text-slate-500">
              {{ myOrdersCount() }} {{ myOrdersCount() === 1 ? 'entrega' : 'entregas' }} hoy
            </p>
          </div>
        </section>

        <!-- DYNAMIC ACTION HERO -->
        <section aria-label="Acción Principal">
          @if (myOrdersCount() > 0) {
            <!-- ACTIVO: Tiene una entrega en curso -->
            <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-6 shadow-lg shadow-orange-500/30 text-white">
              <div class="absolute -right-4 -top-4 opacity-10">
                <lucide-angular class="h-32 w-32" [img]="boltIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div class="relative z-10">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  <span class="h-2 w-2 animate-pulse rounded-full bg-white"></span>
                  En progreso
                </span>
                <h2 class="mt-4 text-2xl font-black leading-tight">Entrega activa</h2>
                <p class="mt-1 text-sm font-medium text-white/90">Sigue la ruta hacia tu destino en el mapa</p>
                
                <a routerLink="/driver/active-order" class="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-black text-orange-600 shadow-sm transition active:scale-95 no-underline">
                  <lucide-angular class="h-5 w-5" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                  Ver Mapa y Ruta
                </a>
              </div>
            </div>
          } @else {
            <!-- INACTIVO: Buscar pedidos -->
            <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 shadow-lg shadow-primary-700/30 text-white">
              <div class="absolute -right-4 -top-4 opacity-10">
                <lucide-angular class="h-40 w-40" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
              </div>
              <div class="relative z-10">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                  <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                  {{ isOnline() ? 'Listo para recibir pedidos' : 'En descanso' }}
                </span>
                <h2 class="mt-4 text-2xl font-black leading-tight">¿Listo para rodar?</h2>
                <p class="mt-1 text-sm font-medium text-primary-100">Hay <strong class="text-white">{{ availableOrdersCount() }} pedidos disponibles</strong> cerca de ti.</p>
                
                <a routerLink="/driver/orders" class="mt-5 flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-black text-primary-700 shadow-sm transition active:scale-95 no-underline">
                  <lucide-angular class="h-5 w-5" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                  Ver Pedidos Disponibles
                </a>
              </div>
            </div>
          }
        </section>

        <!-- DASHBOARD DISPONIBILIDAD -->
        <section class="grid grid-cols-2 gap-3" aria-label="Métricas del día">
          <a class="flex flex-col justify-center rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 no-underline transition active:scale-95" routerLink="/driver/orders">
            <div class="flex items-center gap-2 text-slate-500">
               <lucide-angular class="h-4 w-4 text-primary-600" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
               <span class="text-[11px] font-black uppercase tracking-wider text-slate-600">Disponibles</span>
            </div>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ availableOrdersCount() }}</p>
          </a>
          
          <a class="flex flex-col justify-center rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 no-underline transition active:scale-95" routerLink="/driver/orders/my">
            <div class="flex items-center gap-2 text-slate-500">
               <lucide-angular class="h-4 w-4 text-amber-500" [img]="starIcon" aria-hidden="true"></lucide-angular>
               <span class="text-[11px] font-black uppercase tracking-wider text-slate-600">Historial</span>
            </div>
            <p class="mt-2 text-3xl font-black text-slate-900">{{ myOrdersCount() }}</p>
          </a>
        </section>

        <p class="mt-2 px-4 text-center text-xs leading-relaxed text-slate-400">{{ trustLevelHint() }}</p>
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
  readonly mapPinIcon = MapPin;
  readonly trendingUpIcon = TrendingUp;
  readonly walletIcon = Wallet;
  readonly powerIcon = Power;

  readonly availableOrdersCount = signal(0);
  readonly myOrdersCount = signal(0);
  readonly todayEarnings = signal(0);
  readonly isOnline = signal(true);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly currentRole = computed(() => this.authService.currentUser()?.role ?? 'Driver');

  constructor() {
    this.loadDashboard();
  }

  toggleOnlineStatus(): void {
    this.isOnline.update((v) => !v);
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
          const totalEarned = myOrders.reduce((sum, o) => sum + (o.courierEarningAmount || 0), 0);
          this.todayEarnings.set(totalEarned);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el inicio del driver.'));
          this.isLoading.set(false);
        },
      });
  }
}

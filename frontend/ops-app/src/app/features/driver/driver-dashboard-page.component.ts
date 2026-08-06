import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Bike, Bolt, Compass, LucideAngularModule, RefreshCw, ShieldCheck, Star } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-driver-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    AppNoticeComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedLoadingStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(118px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-5 lg:gap-6'">
      <app-surface-card variant="hero" extraClass="p-5">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div class="grid gap-4">
            <app-internal-page-section-header
              eyebrow="Repartidor"
              title="Tu ruta"
              subtitle="Pedidos disponibles, entrega activa e historial en una experiencia móvil rápida."
            />

            <div class="flex flex-wrap items-center gap-3">
              <div class="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900">
                <lucide-angular class="h-4 w-4 text-primary-700" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                {{ trustLevelLabel() }}
              </div>
              <div class="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900">
                <lucide-angular class="h-4 w-4 text-primary-700" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                Puntaje {{ trustScore() }}%
              </div>
            </div>
          </div>

          <app-surface-card variant="page" extraClass="min-w-[18rem] p-5">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="compassIcon" aria-hidden="true"></lucide-angular>
              Estado de ruta
            </div>
            <p class="mt-3 text-sm leading-6 text-slate-500">
              {{ trustLevelHint() }}
            </p>
            <div class="mt-4 grid gap-2">
              <app-button [routerLink]="'/driver/orders'" block>Ver disponibles</app-button>
              <app-button variant="secondary" [routerLink]="'/driver/active-order'" block>Pedido activo</app-button>
            </div>
          </app-surface-card>
        </div>
      </app-surface-card>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      }

      @if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando resumen del driver" />
          <app-unified-loading-state label="Preparando operación" />
        </div>
      } @else {
        <app-surface-card variant="page" extraClass="p-5">
          <app-notice
            tone="info"
            title="Operación del repartidor"
            message="Solo puedes tomar pedidos cuando tu cuenta está aprobada y no tienes otro pedido activo. Si una acción falla, revisa el mensaje del backend."
          />

          <div class="mt-5 grid gap-3 min-[390px]:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Pedidos disponibles</p>
              <p class="mt-2 text-2xl font-black leading-none text-slate-950">{{ availableOrdersCount() }}</p>
              <p class="mt-1 text-xs text-slate-500">Oportunidades listas para tomar</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Mis pedidos</p>
              <p class="mt-2 text-2xl font-black leading-none text-slate-950">{{ myOrdersCount() }}</p>
              <p class="mt-1 text-xs text-slate-500">Pedidos bajo tu operación ahora</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Nivel de confianza</p>
              <p class="mt-2 text-xl font-black leading-none text-slate-950">{{ trustLevelLabel() }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ trustLevelHint() }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Puntaje</p>
              <p class="mt-2 text-2xl font-black leading-none text-primary-700">{{ trustScore() }}%</p>
              <p class="mt-1 text-xs text-slate-500">Se calcula por entregas completadas</p>
            </div>
          </div>
        </app-surface-card>

        <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <app-surface-card variant="page" extraClass="p-5">
            <div class="grid gap-4">
              <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
                <lucide-angular class="h-4 w-4" [img]="boltIcon" aria-hidden="true"></lucide-angular>
              Acciones principales
              </div>
              <div class="grid gap-3">
                <app-button size="lg" [routerLink]="'/driver/orders'" block>
                  <lucide-angular class="h-4 w-4" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                  Pedidos disponibles
                </app-button>
                <app-button variant="secondary" size="lg" [routerLink]="'/driver/active-order'" block>
                  <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                  Pedido activo
                </app-button>
                <app-button variant="secondary" size="lg" [routerLink]="'/driver/orders/my'" block>
                  <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                  Mis pedidos
                </app-button>
                <app-button variant="ghost" size="lg" [routerLink]="'/community'" block>
                  <lucide-angular class="h-4 w-4" [img]="compassIcon" aria-hidden="true"></lucide-angular>
                  Favores Community
                </app-button>
                <app-button variant="ghost" size="lg" type="button" [disabled]="isLoading()" (click)="loadDashboard()" block>
                  <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                  Recargar
                </app-button>
              </div>
            </div>
          </app-surface-card>

          <app-surface-card variant="page" extraClass="p-5">
            <div class="grid gap-4">
              <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
                <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                Lectura rápida
              </div>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
                Si tu nivel es <strong class="text-slate-950">De confianza</strong>, la red te prioriza mejor en escenarios comunitarios y operativos. Mantener buen cumplimiento te da más visibilidad y mejores coincidencias.
              </div>
            </div>
          </app-surface-card>
        </div>
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

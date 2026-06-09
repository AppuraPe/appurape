import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  Bike,
  Bolt,
  Compass,
  LucideAngularModule,
  RefreshCw,
  ShieldCheck,
  Star,
} from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-driver-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AppNoticeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="hero">
        <div class="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div class="grid gap-4">
            <app-page-header
              eyebrow="AppuraPe Driver"
              title="Panel del driver"
              subtitle="Tu operacion combina pedidos disponibles, reputacion y colaboracion comunitaria dentro de la misma red."
            />

            <div class="flex flex-wrap items-center gap-3">
              <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900">
                <lucide-angular class="h-4 w-4 text-primary-700" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                {{ trustLevelLabel() }}
              </div>
              <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900">
                <lucide-angular class="h-4 w-4 text-primary-700" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                Puntaje {{ trustScore() }}%
              </div>
            </div>
          </div>

          <div class="grid min-w-[18rem] gap-3 rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-[0_12px_28px_rgba(6,25,43,0.08)]">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="compassIcon" aria-hidden="true"></lucide-angular>
              Estado operativo
            </div>
            <p class="text-sm leading-6 text-text-muted">
              {{ trustLevelHint() }}
            </p>
            <div class="flex flex-wrap gap-3">
              <app-button [routerLink]="'/driver/orders/available'">Ver disponibles</app-button>
              <app-button variant="ghost" [routerLink]="'/community'">Ir a comunidad</app-button>
            </div>
          </div>
        </div>
      </app-surface-card>

      <app-surface-card variant="page">
        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        } @else if (isLoading()) {
          <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm font-semibold text-text-muted">
            Cargando resumen del driver...
          </div>
        } @else {
          <app-notice
            tone="info"
            title="Operacion del driver"
            message="Solo puedes tomar pedidos cuando tu cuenta esta aprobada y no tienes otro pedido activo. Si una accion falla, revisa el mensaje del backend."
          />

          <div class="stats-grid">
            <app-metric-card label="Pedidos disponibles" [value]="availableOrdersCount()" helper="Oportunidades listas para tomar" />
            <app-metric-card label="Mis pedidos" [value]="myOrdersCount()" helper="Pedidos bajo tu operacion ahora" />
            <app-metric-card label="Nivel de confianza" [value]="trustLevelLabel()" [helper]="trustLevelHint()" />
            <app-metric-card label="Puntaje" [value]="trustScore() + '%'" helper="Se calcula por entregas completadas" />
          </div>
        }
      </app-surface-card>

      <div class="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="boltIcon" aria-hidden="true"></lucide-angular>
              Acciones rapidas
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <app-button size="lg" [routerLink]="'/driver/orders/available'" block>
                <lucide-angular class="h-4 w-4" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                Pedidos disponibles
              </app-button>
              <app-button variant="secondary" size="lg" [routerLink]="'/driver/orders/my'" block>
                <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                Mis pedidos
              </app-button>
              <app-button variant="ghost" size="lg" [routerLink]="'/community'" block>
                <lucide-angular class="h-4 w-4" [img]="compassIcon" aria-hidden="true"></lucide-angular>
                Red comunitaria
              </app-button>
              <app-button variant="ghost" size="lg" type="button" [disabled]="isLoading()" (click)="loadDashboard()" block>
                <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
                Recargar
              </app-button>
            </div>
          </div>
        </app-surface-card>

        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
              Lectura rapida
            </div>
            <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-4 text-sm leading-6 text-text-muted">
              Si tu nivel es <strong class="text-loreto-carbon">De confianza</strong>, la red te prioriza mejor en escenarios comunitarios y operativos. Mantener buen cumplimiento te da mas visibilidad y mejores coincidencias.
            </div>
          </div>
        </app-surface-card>
      </div>
    </section>
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

    return 'Aun no tienes nivel asignado.';
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
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el dashboard del driver.'));
          this.isLoading.set(false);
        },
      });
  }
}

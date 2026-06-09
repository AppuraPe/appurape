import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  ClipboardList,
  LayoutGrid,
  LucideAngularModule,
  MenuSquare,
  ShieldCheck,
  Store,
} from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { MyRestaurantResponse, RestaurantOrderListItemResponse } from '../../core/models/restaurant.models';
import { MyRestaurantApiService } from '../../core/services/my-restaurant-api.service';
import { RestaurantOrdersApiService } from '../../core/services/restaurant-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-restaurant-dashboard-page',
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
              eyebrow="AppuraPe Restaurant"
              title="Panel del restaurante"
              subtitle="Resumen operativo, visibilidad publica y estado real del negocio dentro de la red."
            />

            @if (restaurant()) {
              <div class="flex flex-wrap items-center gap-3">
                <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900">
                  <lucide-angular class="h-4 w-4 text-primary-700" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                  {{ restaurant()!.name }}
                </div>
                <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900">
                  <lucide-angular class="h-4 w-4 text-primary-700" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                  {{ restaurant()!.approvalStatus }}
                </div>
              </div>
            }
          </div>

          <div class="grid min-w-[18rem] gap-3 rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-[0_12px_28px_rgba(6,25,43,0.08)]">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="clipboardListIcon" aria-hidden="true"></lucide-angular>
              Operacion
            </div>
            <p class="text-sm leading-6 text-text-muted">
              Prepara menu, horarios y perfil para que el restaurante se vea solido tanto en delivery como en la capa comunitaria.
            </p>
            <div class="flex flex-wrap gap-3">
              <app-button [routerLink]="'/restaurant/orders'">Ver pedidos</app-button>
              <app-button variant="ghost" [routerLink]="'/restaurant/profile'">Ver perfil</app-button>
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
            Cargando contexto del restaurante...
          </div>
        } @else if (restaurant()) {
          @if (restaurant()!.approvalStatus === 'Pending') {
            <app-notice
              tone="warning"
              title="Tu restaurante aun no aparece al publico"
              message="Sigue pendiente de aprobacion. Puedes preparar tu perfil y menu, pero no recibiras pedidos hasta que admin lo apruebe."
            />
          }

          @if (restaurant()!.approvalStatus === 'Rejected' || !restaurant()!.isActive) {
            <app-notice
              tone="danger"
              title="Operacion restringida"
              message="Tu restaurante no esta activo para recibir pedidos. Revisa el estado de aprobacion o contacta al administrador."
            />
          }

          <div class="stats-grid">
            <app-metric-card label="Restaurante" [value]="restaurant()!.name" helper="Nombre visible en la plataforma" />
            <app-metric-card label="Zona" [value]="restaurant()!.zoneName" helper="Area de cobertura actual" />
            <app-metric-card label="Pedidos totales" [value]="ordersCount()" helper="Historial cargado en este contexto" />
            <app-metric-card label="Pendientes o activos" [value]="activeOrdersCount()" helper="Requieren seguimiento operativo" />
            <app-metric-card label="Aprobacion" [value]="restaurant()!.approvalStatus" helper="Estado administrativo actual" />
          </div>
        }
      </app-surface-card>

      <div class="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="layoutGridIcon" aria-hidden="true"></lucide-angular>
              Acciones rapidas
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <app-button size="lg" [routerLink]="'/restaurant/orders'" block>
                <lucide-angular class="h-4 w-4" [img]="clipboardListIcon" aria-hidden="true"></lucide-angular>
                Pedidos
              </app-button>
              <app-button variant="secondary" size="lg" [routerLink]="'/restaurant/profile'" block>
                <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                Perfil
              </app-button>
              <app-button variant="ghost" size="lg" [routerLink]="'/restaurant/menu/categories'" block>
                <lucide-angular class="h-4 w-4" [img]="layoutGridIcon" aria-hidden="true"></lucide-angular>
                Categorias
              </app-button>
              <app-button variant="ghost" size="lg" [routerLink]="'/restaurant/menu/items'" block>
                <lucide-angular class="h-4 w-4" [img]="menuSquareIcon" aria-hidden="true"></lucide-angular>
                Productos
              </app-button>
            </div>
          </div>
        </app-surface-card>

        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
              Consejo operativo
            </div>
            <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-4 text-sm leading-6 text-text-muted">
              Mantener bien descritos el perfil, el horario y el menu reduce errores en pedidos y mejora la confianza del cliente cuando tu restaurante ya esta visible.
            </div>
          </div>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class RestaurantDashboardPageComponent {
  private readonly myRestaurantApi = inject(MyRestaurantApiService);
  private readonly restaurantOrdersApi = inject(RestaurantOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeIcon = Store;
  readonly shieldCheckIcon = ShieldCheck;
  readonly clipboardListIcon = ClipboardList;
  readonly layoutGridIcon = LayoutGrid;
  readonly menuSquareIcon = MenuSquare;

  readonly restaurant = signal<MyRestaurantResponse | null>(null);
  readonly ordersCount = signal(0);
  readonly activeOrdersCount = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      restaurant: this.myRestaurantApi.getMyRestaurant(),
      orders: this.restaurantOrdersApi.getOrders(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ restaurant, orders }) => {
          this.restaurant.set(restaurant);
          this.ordersCount.set(orders.length);
          this.activeOrdersCount.set(this.countActiveOrders(orders));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el dashboard del restaurante.'));
          this.isLoading.set(false);
        },
      });
  }

  private countActiveOrders(orders: RestaurantOrderListItemResponse[]): number {
    return orders.filter((order) =>
      ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'OnTheWay'].includes(order.status),
    ).length;
  }
}

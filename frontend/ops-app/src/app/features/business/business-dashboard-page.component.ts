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
import { BusinessOrderListItemResponse, MyBusinessResponse } from '../../core/models/business.model';
import { BusinessOrdersApiService } from '../../core/services/business-orders-api.service';
import { MyBusinessApiService } from '../../core/services/my-business-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-business-dashboard-page',
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
    <section class="grid gap-5 lg:gap-6">
      <app-surface-card variant="hero" extraClass="p-5">
        <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] xl:items-start">
          <div class="grid gap-4">
            <app-page-header
              eyebrow="Negocio"
              title="Mi negocio"
              subtitle="Pedidos, catálogo y visibilidad pública en un solo lugar."
            />

            @if (restaurant()) {
              <div class="flex flex-wrap items-center gap-3">
                <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900">
                  <lucide-angular class="h-4 w-4 text-primary-700" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                  {{ restaurant()!.name }}
                </div>
                <div class="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-2 text-sm font-semibold text-primary-900">
                  <lucide-angular class="h-4 w-4 text-primary-700" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                  {{ approvalStatusLabel(restaurant()!.approvalStatus) }}
                </div>
              </div>
            }
          </div>

          <div class="grid gap-3 rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="clipboardListIcon" aria-hidden="true"></lucide-angular>
              Hoy
            </div>
            <p class="text-sm leading-6 text-text-muted">
              Mantén el catálogo listo y revisa pedidos nuevos sin salir del flujo móvil.
            </p>
            <div class="grid gap-2">
              <app-button [routerLink]="'/business/orders'" block>Ver pedidos</app-button>
              <app-button variant="secondary" [routerLink]="'/business/menu/items'" block>Gestionar catálogo</app-button>
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
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            Cargando contexto del negocio...
          </div>
        } @else if (restaurant()) {
          @if (restaurant()!.approvalStatus === 'Pending') {
            <app-notice
              tone="warning"
              title="Tu negocio aún no aparece al público"
              message="Sigue pendiente de aprobación. Puedes preparar tu perfil y catálogo, pero no recibirás pedidos hasta que admin lo apruebe."
            />
          }

          @if (restaurant()!.approvalStatus === 'Rejected' || !restaurant()!.isActive) {
            <app-notice
              tone="danger"
              title="Operación restringida"
              message="Tu negocio no está activo para recibir pedidos. Revisa el estado de aprobación o contacta al administrador."
            />
          }

          <div class="mt-4 grid gap-3 min-[390px]:grid-cols-2 xl:grid-cols-4">
            <app-metric-card label="Negocio" [value]="restaurant()!.name" helper="Nombre visible en la plataforma" />
            <app-metric-card label="Zona" [value]="restaurant()!.zoneName" helper="Área de cobertura actual" />
            <app-metric-card label="Pedidos totales" [value]="ordersCount()" helper="Historial cargado en este contexto" />
            <app-metric-card label="Pendientes o activos" [value]="activeOrdersCount()" helper="Requieren seguimiento operativo" />
          </div>
        }
      </app-surface-card>

      <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
              <lucide-angular class="h-4 w-4" [img]="layoutGridIcon" aria-hidden="true"></lucide-angular>
              Acciones principales
            </div>
            <div class="grid gap-3">
              <app-button size="lg" [routerLink]="'/business/orders'" block>
                <lucide-angular class="h-4 w-4" [img]="clipboardListIcon" aria-hidden="true"></lucide-angular>
                Ver pedidos
              </app-button>
              <app-button variant="secondary" size="lg" [routerLink]="'/business/profile'" block>
                <lucide-angular class="h-4 w-4" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                Editar perfil
              </app-button>
              <app-button variant="ghost" size="lg" [routerLink]="'/business/menu/categories'" block>
                <lucide-angular class="h-4 w-4" [img]="layoutGridIcon" aria-hidden="true"></lucide-angular>
                Gestionar categorías
              </app-button>
              <app-button variant="ghost" size="lg" [routerLink]="'/business/menu/items'" block>
                <lucide-angular class="h-4 w-4" [img]="menuSquareIcon" aria-hidden="true"></lucide-angular>
                Gestionar productos
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
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500">
              Mantener bien descritos el perfil, el horario y el catálogo reduce errores en pedidos y mejora la confianza del cliente cuando tu negocio ya está visible.
            </div>
          </div>
        </app-surface-card>
      </div>
    </section>
  `,
})
export class BusinessDashboardPageComponent {
  private readonly myBusinessApi = inject(MyBusinessApiService);
  private readonly businessOrdersApi = inject(BusinessOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly storeIcon = Store;
  readonly shieldCheckIcon = ShieldCheck;
  readonly clipboardListIcon = ClipboardList;
  readonly layoutGridIcon = LayoutGrid;
  readonly menuSquareIcon = MenuSquare;

  readonly restaurant = signal<MyBusinessResponse | null>(null);
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
      restaurant: this.myBusinessApi.getMyBusiness(),
      orders: this.businessOrdersApi.getOrders(),
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
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el inicio del negocio.'));
          this.isLoading.set(false);
        },
      });
  }

  private countActiveOrders(orders: BusinessOrderListItemResponse[]): number {
    return orders.filter((order) =>
      ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'OnTheWay'].includes(order.status),
    ).length;
  }

  approvalStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'Pendiente';
      case 'Approved':
        return 'Aprobado';
      case 'Rejected':
        return 'Rechazado';
      default:
        return status || 'Sin estado';
    }
  }
}


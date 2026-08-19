import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, MapPin, MessageSquare, Phone, RefreshCw, Store, Navigation } from 'lucide-angular';
import { DriverOrderDetailResponse } from '../../core/models/driver.models';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';

@Component({
  selector: 'app-driver-active-order-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden bg-slate-50 min-h-screen',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    BottomSafeActionBarComponent,
    StatusBadgeComponent,
    MobilePageShellComponent,
    UnifiedEmptyStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(104px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-4xl content-start gap-4 overflow-x-hidden pt-4 px-2'">
      <header class="flex items-center justify-between px-1">
        <h1 class="text-2xl font-black text-slate-900 tracking-tight">Entrega Activa</h1>
        <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 active:scale-95 transition" (click)="loadActiveOrder()" [disabled]="isLoading()" aria-label="Actualizar entrega">
          <lucide-angular class="h-4 w-4" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
        </button>
      </header>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      }

      @if (isLoading()) {
        <div class="grid gap-4" aria-label="Cargando entrega activa" aria-busy="true">
          @for (skeleton of [1, 2, 3]; track skeleton) {
            <div class="h-28 animate-pulse rounded-3xl bg-slate-200"></div>
          }
        </div>
      } @else if (errorMessage()) {
        <app-unified-empty-state title="No pudimos cargar el pedido activo" message="Intenta nuevamente para revisar la entrega actual.">
          <app-button type="button" variant="secondary" (click)="loadActiveOrder()">Reintentar</app-button>
        </app-unified-empty-state>
      } @else if (!activeOrder()) {
        <app-unified-empty-state title="Sin pedido activo" message="Todavía no tienes una entrega activa. Puedes revisar los pedidos disponibles para tomar uno.">
          <app-button [routerLink]="'/driver/orders'">Ver pedidos disponibles</app-button>
        </app-unified-empty-state>
      } @else if (activeOrder(); as order) {
        
        <!-- CARD PRINCIPAL DE ESTADO -->
        <app-surface-card variant="default" extraClass="grid w-full min-w-0 max-w-full gap-4 p-5 rounded-3xl shadow-sm border-0 ring-1 ring-slate-200">
          <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pedido {{ shortOrderId(order.id) }}</p>
              <strong class="block truncate text-xl font-black text-slate-900" [title]="order.restaurantName">{{ order.restaurantName }}</strong>
            </div>
            <div class="shrink-0 text-right bg-emerald-50 px-3 py-1.5 rounded-xl">
              <p class="text-[10px] font-black uppercase tracking-wider text-emerald-700">Tu ganancia</p>
              <p class="mt-0.5 whitespace-nowrap text-2xl font-black tabular-nums text-emerald-700 leading-none">{{ order.courierEarningAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</p>
            </div>
          </div>

          <div class="flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
            <app-status-badge [status]="order.status" [label]="readableOrderStatus(order.status)" />
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{{ paymentMethodLabel(order.paymentMethod) }}</span>
          </div>

          <div class="grid grid-cols-3 gap-2" aria-label="Progreso de entrega">
            @for (step of deliverySteps; track step.status) {
              <div class="min-w-0 rounded-2xl px-2 py-3 text-center transition" [class]="isStepComplete(order.status, step.status) ? 'bg-primary-50 text-primary-700' : 'bg-slate-50 text-slate-400'">
                <span class="mx-auto grid h-6 w-6 place-items-center rounded-full text-xs font-black shadow-sm" [class]="isStepComplete(order.status, step.status) ? 'bg-primary-700 text-white' : 'bg-white text-slate-400'">{{ step.index }}</span>
                <p class="mt-2 truncate text-xs font-bold">{{ step.label }}</p>
              </div>
            }
          </div>

          <div class="rounded-2xl bg-orange-50 px-4 py-3 border border-orange-100">
            <p class="text-xs font-black uppercase tracking-wider text-orange-700">Siguiente paso</p>
            <p class="mt-1 text-base font-bold text-slate-900">{{ nextStepLabel(order.status) }}</p>
          </div>
        </app-surface-card>

        <div class="grid gap-3 md:grid-cols-2">
          
          <!-- CARD RECOJO -->
          <app-surface-card variant="default" extraClass="grid min-w-0 gap-3 p-5 rounded-3xl shadow-sm border-0 ring-1 ring-slate-200">
            <div class="flex min-w-0 items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                 <div class="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <lucide-angular class="h-4 w-4 shrink-0" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                 </div>
                 <p class="text-xs font-black uppercase tracking-wider text-slate-500">Recoger en</p>
              </div>
            </div>
            
            <div>
               <p class="truncate text-base font-black text-slate-900" [title]="order.restaurantName">{{ order.restaurantName }}</p>
               <p class="break-words text-sm mt-1 text-slate-600">{{ order.restaurantAddress }}</p>
            </div>

            <a class="mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 no-underline active:bg-slate-200 transition" [href]="googleMapUrl(order.restaurantAddress)" target="_blank" rel="noopener">
               <lucide-angular class="h-4 w-4" [img]="navigationIcon" aria-hidden="true"></lucide-angular>
               Abrir en Maps
            </a>
          </app-surface-card>

          <!-- CARD ENTREGA -->
          <app-surface-card variant="default" extraClass="grid min-w-0 gap-3 p-5 rounded-3xl shadow-sm border-0 ring-1 ring-primary-100 bg-primary-50/30">
            <div class="flex min-w-0 items-center gap-2">
               <div class="p-2 bg-primary-100 rounded-lg text-primary-700">
                  <lucide-angular class="h-4 w-4 shrink-0" [img]="mapIcon" aria-hidden="true"></lucide-angular>
               </div>
               <p class="text-xs font-black uppercase tracking-wider text-primary-700">Entregar a</p>
            </div>
            
            <div>
               <p class="truncate text-base font-black text-slate-900" [title]="order.customerName">{{ order.customerName }}</p>
               <p class="break-words text-sm mt-1 text-slate-700">{{ order.deliveryAddress }}</p>
               @if (order.deliveryReference) {
                 <p class="mt-2 rounded-lg bg-white p-2 text-xs text-slate-500 ring-1 ring-slate-200">Ref: {{ order.deliveryReference }}</p>
               }
            </div>
            
            <div class="grid grid-cols-3 gap-2 mt-2">
               <a class="flex items-center justify-center gap-1.5 rounded-xl bg-primary-700 px-2 py-3 text-xs font-bold text-white no-underline active:bg-primary-800 transition shadow-sm" [href]="googleMapUrl(order.deliveryAddress)" target="_blank" rel="noopener">
                  <lucide-angular class="h-4 w-4" [img]="navigationIcon" aria-hidden="true"></lucide-angular>
                  Maps
               </a>
               @if (order.customerPhone) {
                 <a class="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2 py-3 text-xs font-bold text-white no-underline active:bg-emerald-700 transition shadow-sm" [href]="whatsappUrl(order.customerPhone, order.id)" target="_blank" rel="noopener">
                   <lucide-angular class="h-4 w-4" [img]="messageIcon" aria-hidden="true"></lucide-angular>
                   WhatsApp
                 </a>
                 <a class="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-3 text-xs font-bold text-slate-700 ring-1 ring-slate-200 no-underline active:bg-slate-50 transition" [href]="'tel:' + order.customerPhone">
                   <lucide-angular class="h-4 w-4 text-slate-600" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                   Llamar
                 </a>
               }
            </div>
          </app-surface-card>
        </div>

        <app-bottom-safe-action-bar mode="fixed">
          @if (order.status === 'Assigned') {
            <app-button size="lg" (click)="advanceStatus(order, 'PickedUp')" [disabled]="isUpdatingStatus()" block>
              {{ isUpdatingStatus() ? 'Actualizando...' : 'Confirmar Recojo en Negocio' }}
            </app-button>
          } @else if (order.status === 'PickedUp') {
            <app-button size="lg" (click)="advanceStatus(order, 'OnTheWay')" [disabled]="isUpdatingStatus()" block>
              {{ isUpdatingStatus() ? 'Actualizando...' : 'Iniciar Viaje al Cliente' }}
            </app-button>
          } @else {
            <app-button size="lg" [routerLink]="['/driver/orders', order.id]" block>
              Ingresar PIN de Entrega
            </app-button>
          }
        </app-bottom-safe-action-bar>
      }
    </app-mobile-page-shell>
  `,
})
export class DriverActiveOrderPageComponent {
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly mapIcon = MapPin;
  readonly storeIcon = Store;
  readonly phoneIcon = Phone;
  readonly refreshIcon = RefreshCw;
  readonly navigationIcon = Navigation;
  
  readonly deliverySteps = [
    { index: 1, label: 'Recogido', status: 'PickedUp' },
    { index: 2, label: 'En camino', status: 'OnTheWay' },
    { index: 3, label: 'Entregado', status: 'Delivered' },
  ] as const;

  readonly activeOrder = signal<DriverOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadActiveOrder();
  }

  loadActiveOrder(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.driverOrdersApi
      .getActiveOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.activeOrder.set(order);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el pedido activo.'));
          this.isLoading.set(false);
        },
      });
  }

  shortOrderId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  readableOrderStatus(status: string): string {
    switch (status) {
      case 'Assigned':
        return 'Repartidor asignado';
      case 'PickedUp':
        return 'Recogido';
      case 'OnTheWay':
        return 'En camino';
      case 'Delivered':
        return 'Entregado';
      case 'Cancelled':
        return 'Cancelado';
      default:
        return 'En proceso';
    }
  }

  isStepComplete(currentStatus: string, stepStatus: string): boolean {
    const order = ['Assigned', 'ReadyForPickup', 'PickedUp', 'OnTheWay', 'Delivered'];
    return order.indexOf(currentStatus) >= order.indexOf(stepStatus);
  }

  nextStepLabel(status: string): string {
    switch (status) {
      case 'Assigned':
      case 'ReadyForPickup':
        return 'Ve al negocio y confirma el recojo.';
      case 'PickedUp':
        return 'Inicia la ruta hacia el cliente.';
      case 'OnTheWay':
        return 'Entrega el pedido al cliente.';
      case 'Delivered':
        return 'Entrega completada.';
      default:
        return 'Revisa el detalle para continuar.';
    }
  }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[method] ?? 'Método registrado';
  }

  readonly messageIcon = MessageSquare;
  readonly isUpdatingStatus = signal(false);

  whatsappUrl(phone?: string, orderId?: string): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(`¡Hola! Te escribe tu repartidor de AppuraPe sobre tu pedido #${this.shortOrderId(orderId || '')}. Ya voy en camino con tu entrega 🛵.`);
    return `https://wa.me/${fullPhone}?text=${text}`;
  }

  advanceStatus(order: DriverOrderDetailResponse, nextStatus: 'PickedUp' | 'OnTheWay'): void {
    this.isUpdatingStatus.set(true);
    const obs$ = nextStatus === 'PickedUp'
      ? this.driverOrdersApi.markPickedUp(order.id)
      : this.driverOrdersApi.markOnTheWay(order.id);

    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isUpdatingStatus.set(false);
        this.loadActiveOrder();
      },
      error: (error) => {
        this.isUpdatingStatus.set(false);
        this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar el estado de la entrega.'));
      },
    });
  }

  googleMapUrl(address: string): string {
    if (!address) return '#';
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  }
}

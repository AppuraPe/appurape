import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ClipboardList, LayoutGrid, LucideAngularModule, MenuSquare, ShieldCheck, Store } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { BusinessOrderListItemResponse, MyBusinessResponse } from '../../core/models/business.model';
import { BusinessOrdersApiService } from '../../core/services/business-orders-api.service';
import { MyBusinessApiService } from '../../core/services/my-business-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';

@Component({
  selector: 'app-business-dashboard-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [RouterLink, LucideAngularModule, AppButtonComponent],
  templateUrl: './business-dashboard-page.component.html',
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

  approvalStatusLabel(status: string): string {
    switch (status) {
      case 'Pending':
        return 'En revisión';
      case 'Approved':
        return 'Aprobado';
      case 'Rejected':
        return 'Rechazado';
      case 'Suspended':
        return 'Suspendido';
      default:
        return 'Por revisar';
    }
  }

  private countActiveOrders(orders: BusinessOrderListItemResponse[]): number {
    return orders.filter((order) =>
      ['Pending', 'Accepted', 'Preparing', 'ReadyForPickup', 'Assigned', 'PickedUp', 'OnTheWay'].includes(order.status),
    ).length;
  }
}

import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DriverOrdersApiService } from '../../core/services/driver-orders-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  selector: 'app-driver-dashboard-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, AppNoticeComponent],
  template: `
    <section class="grid">
      <div class="page-card">
        <app-page-header
          eyebrow="AppuraPe Driver"
          title="Panel del driver"
          subtitle="Resumen basico con pedidos disponibles y pedidos propios."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        } @else if (isLoading()) {
          <div class="message">Cargando resumen del driver...</div>
        } @else {
          <app-notice
            tone="info"
            title="Operacion del driver"
            message="Solo puedes tomar pedidos cuando tu cuenta esta aprobada y no tienes otro pedido activo. Si una accion falla, revisa el mensaje del backend."
          />

          <div class="stats-grid">
            <div class="stat-card">
              <span class="muted">Pedidos disponibles</span>
              <strong>{{ availableOrdersCount() }}</strong>
            </div>
            <div class="stat-card">
              <span class="muted">Mis pedidos</span>
              <strong>{{ myOrdersCount() }}</strong>
            </div>
          </div>
        }

        <div class="page-actions">
          <a class="button" routerLink="/driver/orders/available">Ver disponibles</a>
          <a class="button secondary" routerLink="/driver/orders/my">Ver mis pedidos</a>
          <button class="button ghost" type="button" (click)="loadDashboard()" [disabled]="isLoading()">Recargar</button>
        </div>
      </div>
    </section>
  `,
})
export class DriverDashboardPageComponent {
  private readonly driverOrdersApi = inject(DriverOrdersApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly availableOrdersCount = signal(0);
  readonly myOrdersCount = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadDashboard();
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

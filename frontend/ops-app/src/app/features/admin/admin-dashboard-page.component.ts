import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    InternalPageSectionHeaderComponent,
    MobilePageShellComponent,
    UnifiedLoadingStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-[calc(88px+env(safe-area-inset-bottom,0px))]'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid gap-4 lg:gap-6'">
      <app-surface-card variant="hero" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="AppuraPe Admin"
          title="Inicio administrativo"
          subtitle="Resumen rápido de revisiones, pagos y salud de la red."
        />

        <app-notice
          class="mt-5"
          tone="info"
          title="Prioridad de la red"
          message="Revisa primero cuentas pendientes y pagos manuales. Aprobar habilita la operación; suspender bloquea temporalmente el uso de la plataforma."
        />
      </app-surface-card>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      } @else if (isLoading()) {
        <div class="grid gap-3">
          <app-unified-loading-state label="Cargando pendientes" />
          <app-unified-loading-state label="Preparando resumen administrativo" />
        </div>
      } @else {
        <app-surface-card variant="page" extraClass="p-4">
          <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Negocios</span>
              <strong class="mt-2 block text-2xl font-black leading-none text-slate-950">{{ pendingRestaurantsCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-slate-500">Pendientes</small>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Drivers</span>
              <strong class="mt-2 block text-2xl font-black leading-none text-slate-950">{{ pendingDriversCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-slate-500">Pendientes</small>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Favores</span>
              <strong class="mt-2 block text-2xl font-black leading-none text-primary-700">{{ openCommunityRequestsCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-slate-500">Abiertos</small>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <span class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-slate-500">Colaboradores</span>
              <strong class="mt-2 block text-2xl font-black leading-none text-primary-700">{{ activeCollaboratorsCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-slate-500">Activos</small>
            </div>
          </div>
        </app-surface-card>
      }

      <app-surface-card variant="page" extraClass="p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="min-w-0 truncate text-base font-black tracking-[-0.03em] text-slate-950">Acciones del día</h2>
          <button
            type="button"
            class="inline-flex min-h-10 shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-black text-primary-700 shadow-sm disabled:opacity-55"
            (click)="loadDashboard()"
            [disabled]="isLoading()"
          >
            Recargar
          </button>
        </div>
        <div class="grid gap-2">
          <a routerLink="/admin/businesses/pending" class="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 no-underline shadow-sm">
            Negocios pendientes
            <span class="text-primary-700">Ver</span>
          </a>
          <a routerLink="/admin/drivers/pending" class="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 no-underline shadow-sm">
            Drivers pendientes
            <span class="text-primary-700">Ver</span>
          </a>
          <a routerLink="/admin/payments" class="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 no-underline shadow-sm">
            Pagos manuales
            <span class="text-primary-700">Revisar</span>
          </a>
          <a routerLink="/admin/community" class="flex min-h-14 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 no-underline shadow-sm">
            Favores
            <span class="text-primary-700">Abrir</span>
          </a>
        </div>
      </app-surface-card>
    </app-mobile-page-shell>
  `,
})
export class AdminDashboardPageComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly communityApi = inject(CommunityApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingRestaurantsCount = signal(0);
  readonly pendingDriversCount = signal(0);
  readonly openCommunityRequestsCount = signal(0);
  readonly activeCollaboratorsCount = signal(0);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      restaurants: this.adminApi.getPendingRestaurants(),
      drivers: this.adminApi.getPendingDrivers(),
      community: this.communityApi.getAdminOverview(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ restaurants, drivers, community }) => {
          this.pendingRestaurantsCount.set(restaurants.length);
          this.pendingDriversCount.set(drivers.length);
          this.openCommunityRequestsCount.set(community.publishedRequestsCount);
          this.activeCollaboratorsCount.set(community.activeCollaboratorsCount);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el inicio admin.'));
          this.isLoading.set(false);
        },
      });
  }
}

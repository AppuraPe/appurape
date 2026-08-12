import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BadgeCheck, Bike, CircleDollarSign, CreditCard, HeartHandshake, LucideAngularModule, ReceiptText, RefreshCw, Settings, Store, Tags } from 'lucide-angular';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';

@Component({
  selector: 'app-admin-dashboard-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [
    RouterLink,
    LucideAngularModule,
    AppNoticeComponent,
    InternalPageSectionHeaderComponent,
    MobilePageShellComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-5xl content-start gap-3.5 overflow-x-hidden lg:gap-4'">
      <header class="grid gap-3 px-0.5">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <app-internal-page-section-header
            eyebrow="Administración"
            title="Resumen de hoy"
            subtitle="Revisa pendientes y continúa con la gestión de la red."
          />
          <button type="button" class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-primary-700 shadow-sm active:scale-95" (click)="loadDashboard()" [disabled]="isLoading()" aria-label="Actualizar resumen">
            <lucide-angular class="h-4 w-4" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
          </button>
        </div>
      </header>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      } @else if (isLoading()) {
        <div class="grid gap-2" aria-label="Cargando resumen administrativo" aria-busy="true">
          <div class="grid grid-cols-2 gap-2">
            @for (skeleton of [1, 2, 3, 4]; track skeleton) {
              <div class="h-[82px] animate-pulse rounded-2xl border border-slate-200 bg-white p-3.5"><div class="h-2.5 w-2/3 rounded-full bg-slate-200"></div><div class="mt-3 h-6 w-10 rounded-lg bg-slate-100"></div></div>
            }
          </div>
        </div>
      } @else {
        <section class="grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="Indicadores administrativos">
            <a routerLink="/admin/businesses/pending" class="min-w-0 rounded-2xl bg-white p-3.5 text-slate-950 no-underline shadow-sm">
              <span class="block truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Negocios pendientes</span>
              <strong class="mt-1.5 block text-2xl font-black leading-none">{{ pendingRestaurantsCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-primary-700">Revisar</small>
            </a>
            <a routerLink="/admin/drivers/pending" class="min-w-0 rounded-2xl bg-white p-3.5 text-slate-950 no-underline shadow-sm">
              <span class="block truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Repartidores</span>
              <strong class="mt-1.5 block text-2xl font-black leading-none">{{ pendingDriversCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-primary-700">Pendientes</small>
            </a>
            <a routerLink="/admin/community" class="min-w-0 rounded-2xl bg-white p-3.5 text-slate-950 no-underline shadow-sm">
              <span class="block truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Favores abiertos</span>
              <strong class="mt-1.5 block text-2xl font-black leading-none text-primary-700">{{ openCommunityRequestsCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-slate-500">Publicados</small>
            </a>
            <a routerLink="/admin/collaborator-verifications" class="min-w-0 rounded-2xl bg-white p-3.5 text-slate-950 no-underline shadow-sm">
              <span class="block truncate text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">Colaboradores</span>
              <strong class="mt-1.5 block text-2xl font-black leading-none text-primary-700">{{ activeCollaboratorsCount() }}</strong>
              <small class="mt-1 block text-xs font-semibold text-slate-500">Activos</small>
            </a>
        </section>

        <section class="grid gap-2.5" aria-labelledby="admin-priority-title">
          <h2 id="admin-priority-title" class="px-1 text-sm font-black tracking-[-0.02em] text-slate-950">Prioridades</h2>
          <div class="grid gap-2 md:grid-cols-2">
            <a routerLink="/admin/payments" class="flex min-w-0 items-center gap-3 rounded-2xl bg-primary-700 p-4 text-white no-underline shadow-lg shadow-primary-700/20">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"><lucide-angular class="h-5 w-5" [img]="paymentIcon" aria-hidden="true"></lucide-angular></span>
              <span class="min-w-0 flex-1"><strong class="block truncate text-sm font-black">Pagos pendientes</strong><small class="mt-0.5 block truncate text-xs font-semibold text-white/80">Revisar Yape y Plin</small></span>
            </a>
            <a routerLink="/admin/collaborator-verifications" class="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 no-underline shadow-sm">
              <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-700"><lucide-angular class="h-5 w-5" [img]="verificationIcon" aria-hidden="true"></lucide-angular></span>
              <span class="min-w-0 flex-1"><strong class="block truncate text-sm font-black">Verificaciones</strong><small class="mt-0.5 block truncate text-xs font-semibold text-slate-500">Validar colaboradores</small></span>
            </a>
          </div>
        </section>
      }

      <section class="grid gap-2.5" aria-labelledby="admin-management-title">
        <h2 id="admin-management-title" class="px-1 text-sm font-black tracking-[-0.02em] text-slate-950">Gestión</h2>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-3">
          @for (item of managementItems; track item.route) {
            <a [routerLink]="item.route" class="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-slate-700 no-underline">
              <lucide-angular class="h-4 w-4 shrink-0 text-primary-700" [img]="item.icon" aria-hidden="true"></lucide-angular>
              <span class="line-clamp-2 min-w-0 text-xs font-bold leading-4">{{ item.label }}</span>
            </a>
          }
        </div>
      </section>
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
  readonly refreshIcon = RefreshCw;
  readonly paymentIcon = CreditCard;
  readonly verificationIcon = BadgeCheck;
  readonly managementItems = [
    { label: 'Comisiones', route: '/admin/commissions', icon: CircleDollarSign },
    { label: 'Liquidaciones', route: '/admin/settlements', icon: ReceiptText },
    { label: 'Negocios', route: '/admin/businesses', icon: Store },
    { label: 'Repartidores', route: '/admin/drivers', icon: Bike },
    { label: 'Tipos de negocio', route: '/admin/business-types', icon: Tags },
    { label: 'Marca', route: '/admin/settings/branding', icon: Settings },
    { label: 'Favores', route: '/admin/community', icon: HeartHandshake },
  ] as const;

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

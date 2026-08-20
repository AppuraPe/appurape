import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { BadgeCheck, Bike, CircleDollarSign, CreditCard, FileText, HeartHandshake, LucideAngularModule, ReceiptText, RefreshCw, Settings, Store, Tags } from 'lucide-angular';
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
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-7xl content-start gap-4 overflow-x-hidden lg:gap-6 pt-2'">
      <header class="grid gap-3 px-0.5">
        <div class="flex min-w-0 items-start justify-between gap-3">
          <app-internal-page-section-header
            eyebrow="Administración General"
            title="Panel de Control"
            subtitle="Monitorea indicadores clave, resuelve prioridades y gestiona la operación."
          />
          <button type="button" class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white text-primary-700 shadow-sm transition active:scale-95 hover:bg-slate-50" (click)="loadDashboard()" [disabled]="isLoading()" aria-label="Actualizar resumen">
            <lucide-angular class="h-4.5 w-4.5" [class.animate-spin]="isLoading()" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
          </button>
        </div>
      </header>

      @if (errorMessage()) {
        <app-notice tone="danger" [message]="errorMessage()" />
      } @else if (isLoading()) {
        <div class="grid gap-3" aria-label="Cargando resumen administrativo" aria-busy="true">
          <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
            @for (skeleton of [1, 2, 3, 4]; track skeleton) {
              <div class="h-28 animate-pulse rounded-3xl border border-slate-200 bg-white p-5"><div class="h-3 w-2/3 rounded-full bg-slate-200"></div><div class="mt-4 h-7 w-12 rounded-xl bg-slate-100"></div></div>
            }
          </div>
        </div>
      } @else {
        <section class="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Indicadores administrativos">
            <a routerLink="/admin/businesses/pending" class="min-w-0 rounded-3xl bg-white p-5 text-slate-950 no-underline shadow-sm border border-slate-200 transition hover:border-primary-300 hover:shadow-md">
              <span class="block truncate text-[11px] font-black uppercase tracking-wider text-slate-500">Negocios pendientes</span>
              <strong class="mt-2 block text-3xl font-black leading-none text-slate-900">{{ pendingRestaurantsCount() }}</strong>
              <small class="mt-2 inline-flex items-center text-xs font-bold text-primary-700">Revisar solicitudes →</small>
            </a>
            <a routerLink="/admin/drivers/pending" class="min-w-0 rounded-3xl bg-white p-5 text-slate-950 no-underline shadow-sm border border-slate-200 transition hover:border-primary-300 hover:shadow-md">
              <span class="block truncate text-[11px] font-black uppercase tracking-wider text-slate-500">Repartidores</span>
              <strong class="mt-2 block text-3xl font-black leading-none text-slate-900">{{ pendingDriversCount() }}</strong>
              <small class="mt-2 inline-flex items-center text-xs font-bold text-primary-700">Por validar →</small>
            </a>
            <a routerLink="/admin/community" class="min-w-0 rounded-3xl bg-white p-5 text-slate-950 no-underline shadow-sm border border-slate-200 transition hover:border-primary-300 hover:shadow-md">
              <span class="block truncate text-[11px] font-black uppercase tracking-wider text-slate-500">Favores abiertos</span>
              <strong class="mt-2 block text-3xl font-black leading-none text-primary-700">{{ openCommunityRequestsCount() }}</strong>
              <small class="mt-2 inline-flex items-center text-xs font-semibold text-slate-500">En la red</small>
            </a>
            <a routerLink="/admin/collaborator-verifications" class="min-w-0 rounded-3xl bg-white p-5 text-slate-950 no-underline shadow-sm border border-slate-200 transition hover:border-primary-300 hover:shadow-md">
              <span class="block truncate text-[11px] font-black uppercase tracking-wider text-slate-500">Colaboradores</span>
              <strong class="mt-2 block text-3xl font-black leading-none text-emerald-700">{{ activeCollaboratorsCount() }}</strong>
              <small class="mt-2 inline-flex items-center text-xs font-semibold text-slate-500">Activos</small>
            </a>
        </section>

        <section class="grid gap-3" aria-labelledby="admin-priority-title">
          <h2 id="admin-priority-title" class="px-1 text-base font-black tracking-tight text-slate-950">Acciones Prioritarias</h2>
          <div class="grid gap-3 md:grid-cols-2">
            <a routerLink="/admin/payments" class="flex min-w-0 items-center gap-4 rounded-3xl bg-gradient-to-br from-primary-700 to-primary-900 p-5 text-white no-underline shadow-lg shadow-primary-700/20 transition hover:scale-[1.005]">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20"><lucide-angular class="h-6 w-6" [img]="paymentIcon" aria-hidden="true"></lucide-angular></span>
              <span class="min-w-0 flex-1"><strong class="block truncate text-base font-black">Pagos manuales pendientes</strong><small class="mt-0.5 block truncate text-xs font-medium text-white/80">Revisar y verificar comprobantes de Yape y Plin</small></span>
            </a>
            <a routerLink="/admin/collaborator-verifications" class="flex min-w-0 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-slate-950 no-underline shadow-sm transition hover:border-primary-300 hover:shadow-md">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-50 text-primary-700"><lucide-angular class="h-6 w-6" [img]="verificationIcon" aria-hidden="true"></lucide-angular></span>
              <span class="min-w-0 flex-1"><strong class="block truncate text-base font-black">Verificaciones de Identidad</strong><small class="mt-0.5 block truncate text-xs font-medium text-slate-500">Validar selfie y fotos de DNI de colaboradores</small></span>
            </a>
          </div>
        </section>
      }

      <section class="grid gap-3" aria-labelledby="admin-management-title">
        <h2 id="admin-management-title" class="px-1 text-base font-black tracking-tight text-slate-950">Módulos de Gestión</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
          @for (item of managementItems; track item.route) {
            <a [routerLink]="item.route" class="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-800 no-underline shadow-sm transition hover:border-primary-300 hover:shadow-sm">
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <lucide-angular class="h-5 w-5 text-primary-700" [img]="item.icon" aria-hidden="true"></lucide-angular>
              </div>
              <span class="text-sm font-bold text-slate-900 leading-tight">{{ item.label }}</span>
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
    { label: 'Legal', route: '/admin/legal', icon: FileText },
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

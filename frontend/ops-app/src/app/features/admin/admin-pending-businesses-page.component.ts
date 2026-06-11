import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  CalendarClock,
  CircleCheckBig,
  CircleX,
  LucideAngularModule,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Store,
  Users,
} from 'lucide-angular';
import { PendingBusinessResponse } from '../../core/models/admin-business.models';
import { AdminBusinessesApiService } from '../../core/services/admin-businesses-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-pending-businesses-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Admin"
          title="Restaurantes pendientes"
          subtitle="Revisa nuevas altas de comercios y habilita solo los perfiles listos para operar dentro de la red."
        />

        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {{ successMessage() }}
          </div>
        }

        <app-notice
          tone="warning"
          title="Validacion previa a la activacion"
          message="Aprobar hace visible al restaurante para clientes y pedidos. Rechazar mantiene la cuenta fuera de operacion hasta nueva revision."
        />

        <div class="stats-grid">
          <app-metric-card label="Pendientes" [value]="restaurants().length" helper="Restaurantes esperando revision" />
          <app-metric-card label="Zonas" [value]="zoneCount()" helper="Cobertura de las altas pendientes" />
          <app-metric-card label="Nuevos hoy" [value]="todayCount()" helper="Registros creados durante el dia" />
          <app-metric-card label="Owner �nicos" [value]="ownerCount()" helper="Personas a validar en esta cola" />
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="grid gap-1">
            <span class="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Cola de aprobacion</span>
            <p class="text-sm text-text-muted">Mant�n la red limpia: valida negocio, contacto y zona antes de activar.</p>
          </div>
          <app-button variant="ghost" [disabled]="isLoading() || !!actionRestaurantId()" (click)="loadRestaurants()">
            <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
            Recargar
          </app-button>
        </div>
      </app-surface-card>

      @if (isLoading()) {
        <div class="rounded-[28px] border border-[#eddad4] bg-white px-6 py-5 text-sm font-semibold text-text-muted shadow-[0_12px_28px_rgba(6,25,43,0.08)]">
          Cargando restaurantes pendientes...
        </div>
      } @else if (!restaurants().length) {
        <app-surface-card variant="page">
          <div class="grid gap-5 text-center md:justify-items-center">
            <div class="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-[0_12px_28px_rgba(16,185,129,0.14)]">
              <lucide-angular class="h-8 w-8" [img]="circleCheckIcon" aria-hidden="true"></lucide-angular>
            </div>
            <div class="grid gap-2">
              <h2 class="text-2xl font-black tracking-[-0.04em] text-loreto-carbon">No hay restaurantes pendientes</h2>
              <p class="max-w-2xl text-sm leading-6 text-text-muted md:text-base">
                La cola de aprobacion esta al dia. Puedes revisar el listado general o volver al dashboard administrativo.
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <app-button size="lg" [routerLink]="'/admin/restaurants'">Ver todos los restaurantes</app-button>
              <app-button size="lg" variant="ghost" [routerLink]="'/admin/dashboard'">Volver al dashboard</app-button>
            </div>
          </div>
        </app-surface-card>
      } @else {
        <div class="grid gap-4">
          @for (restaurant of restaurants(); track restaurant.id) {
            <app-surface-card variant="page">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ restaurant.name }}</strong>
                      <span class="text-sm text-text-muted">Owner: {{ restaurant.ownerFullName }}</span>
                      <span class="text-sm text-text-muted">{{ restaurant.email }} � {{ restaurant.phone }}</span>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                        Zona
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant.zoneName }}</p>
                    </div>

                    <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="usersIcon" aria-hidden="true"></lucide-angular>
                        Owner
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant.ownerFullName }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="restaurant.approvalStatus" prefix="Aprobacion" />
                    <app-status-badge [status]="restaurant.isActive" [label]="restaurant.isActive ? 'Activo' : 'Inactivo'" />
                  </div>

                  <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm text-text-muted">
                    <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                      <lucide-angular class="h-4 w-4" [img]="calendarClockIcon" aria-hidden="true"></lucide-angular>
                      Registrado
                    </div>
                    <p class="mt-2 font-semibold text-loreto-carbon">{{ restaurant.createdAtUtc | date: 'medium' }}</p>
                  </div>

                  <div class="flex flex-wrap gap-3 rounded-2xl border border-[#eddad4] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                    <button
                      type="button"
                      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-primary-700/20 transition duration-150 hover:-translate-y-0.5 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-55"
                      (click)="approveRestaurant(restaurant)"
                      [disabled]="actionRestaurantId() === restaurant.id"
                    >
                      <lucide-angular class="h-4 w-4" [img]="circleCheckIcon" aria-hidden="true"></lucide-angular>
                      {{ actionRestaurantId() === restaurant.id ? 'Procesando...' : 'Aprobar' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger px-5 text-sm font-extrabold text-white shadow-lg shadow-red-900/10 transition duration-150 hover:bg-[#a50f19] disabled:cursor-not-allowed disabled:opacity-55"
                      (click)="rejectRestaurant(restaurant)"
                      [disabled]="actionRestaurantId() === restaurant.id"
                    >
                      <lucide-angular class="h-4 w-4" [img]="circleXIcon" aria-hidden="true"></lucide-angular>
                      Rechazar
                    </button>
                    <app-button variant="secondary" size="md" [routerLink]="['/admin/restaurants', restaurant.id]">
                      Ver detalle
                    </app-button>
                  </div>
                </div>
              </div>
            </app-surface-card>
          }
        </div>
      }
    </section>
  `,
})
export class AdminPendingBusinessesPageComponent {
  private readonly adminBusinessesApi = inject(AdminBusinessesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly refreshIcon = RefreshCw;
  readonly storeIcon = Store;
  readonly mapPinIcon = MapPin;
  readonly usersIcon = Users;
  readonly shieldAlertIcon = ShieldAlert;
  readonly circleCheckIcon = CircleCheckBig;
  readonly circleXIcon = CircleX;
  readonly calendarClockIcon = CalendarClock;

  readonly restaurants = signal<PendingBusinessResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly actionRestaurantId = signal<string | null>(null);
  readonly zoneCount = computed(() => new Set(this.restaurants().map((restaurant) => restaurant.zoneId)).size);
  readonly ownerCount = computed(() => new Set(this.restaurants().map((restaurant) => restaurant.ownerUserId)).size);
  readonly todayCount = computed(() => {
    const today = new Date().toDateString();
    return this.restaurants().filter((restaurant) => new Date(restaurant.createdAtUtc).toDateString() === today).length;
  });

  constructor() {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminBusinessesApi
      .getPendingBusinesses()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurants) => {
          this.restaurants.set(restaurants);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los restaurantes pendientes.'));
          this.isLoading.set(false);
        },
      });
  }

  approveRestaurant(restaurant: PendingBusinessResponse): void {
    this.runRestaurantAction(restaurant.id, restaurant.name, 'aprobo', () => this.adminBusinessesApi.approveBusiness(restaurant.id));
  }

  rejectRestaurant(restaurant: PendingBusinessResponse): void {
    this.runRestaurantAction(restaurant.id, restaurant.name, 'rechazo', () => this.adminBusinessesApi.rejectBusiness(restaurant.id));
  }

  private runRestaurantAction(
    id: string,
    name: string,
    actionLabel: string,
    request: () => ReturnType<AdminBusinessesApiService['approveBusiness']>,
  ): void {
    this.actionRestaurantId.set(id);
    this.errorMessage.set('');
    this.successMessage.set('');

    request()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Se ${actionLabel} el restaurante ${name}.`);
          this.actionRestaurantId.set(null);
          this.loadRestaurants();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar el restaurante ${name}.`));
          this.actionRestaurantId.set(null);
        },
      });
  }
}


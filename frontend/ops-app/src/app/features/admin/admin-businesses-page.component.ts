import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Building2,
  CalendarClock,
  FilterX,
  LucideAngularModule,
  MapPin,
  Search,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { AdminBusinessListItemResponse } from '../../core/models/admin-business.models';
import { AdminBusinessesApiService } from '../../core/services/admin-businesses-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-businesses-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
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
          title="Negocios"
          subtitle="Listado completo de negocios registrados dentro de la red AppuraPe."
        />

        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        }

        <app-notice
          tone="info"
          title="Estados administrativos"
          message="Approved permite operar si el usuario está activo. Suspended bloquea el acceso operativo aunque el negocio exista."
        />

        <div class="stats-grid">
          <app-metric-card label="Negocios" [value]="restaurants().length" helper="Registros visibles con filtros actuales" />
          <app-metric-card label="Activos" [value]="activeRestaurantsCount()" helper="Con operación habilitada" />
          <app-metric-card label="Aprobados" [value]="approvedRestaurantsCount()" helper="Cuentas listas para operar" />
          <app-metric-card label="Con zona" [value]="zonedRestaurantsCount()" helper="Mapeados dentro de cobertura" />
        </div>
      </app-surface-card>

      <app-surface-card
        variant="page"
        extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]"
      >
        <form class="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))_auto]" [formGroup]="filtersForm" (ngSubmit)="loadRestaurants()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Buscar negocio</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="restaurantSearch"
                type="search"
                formControlName="q"
                placeholder="Nombre, owner, email, zona o dirección"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
              />
            </div>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Aprobación</span>
            <select id="approvalStatus" formControlName="approvalStatus">
              <option value="">Todos</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Activo</span>
            <select id="isActive" formControlName="isActive">
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Usuario</span>
            <select id="userStatus" formControlName="userStatus">
              <option value="">Todos</option>
              <option value="Pending">Pending</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
          </label>

          <div class="flex flex-wrap items-end gap-3 xl:justify-end">
            <app-button type="submit" [disabled]="isLoading()">
              <lucide-angular class="h-4 w-4" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              Aplicar
            </app-button>
            <app-button variant="ghost" type="button" [disabled]="isLoading()" (click)="clearFilters()">
              <lucide-angular class="h-4 w-4" [img]="filterXIcon" aria-hidden="true"></lucide-angular>
              Limpiar
            </app-button>
          </div>
        </form>
      </app-surface-card>

      @if (isLoading()) {
        <div class="rounded-[28px] border border-slate-200 bg-white px-6 py-5 text-sm font-semibold text-slate-500 shadow-sm">
          Cargando negocios...
        </div>
      } @else if (!restaurants().length) {
        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
              No hay negocios con los filtros seleccionados.
            </div>
            <div class="flex flex-wrap gap-3">
              <app-button size="lg" type="button" (click)="clearFilters()">Limpiar filtros</app-button>
              <app-button variant="ghost" [routerLink]="'/admin/dashboard'">Volver al inicio</app-button>
            </div>
          </div>
        </app-surface-card>
      } @else {
        <div class="grid gap-4">
          @for (restaurant of restaurants(); track restaurant.restaurantId) {
            <app-surface-card variant="page">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="storeIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ restaurant.name }}</strong>
                      <span class="text-sm text-text-muted">Categoría: {{ restaurant.businessTypeName || 'Sin categoría' }}</span>
                      <span class="text-sm text-text-muted">Owner: {{ restaurant.ownerFullName }}</span>
                      <span class="text-sm text-text-muted">{{ restaurant.ownerEmail }}</span>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                        Zona
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant.zoneName }}</p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="buildingIcon" aria-hidden="true"></lucide-angular>
                        Dirección
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ restaurant.address }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="restaurant.approvalStatus" prefix="Aprobación" />
                    <app-status-badge [status]="restaurant.isActive" [label]="restaurant.isActive ? 'Activo' : 'Inactivo'" />
                    <app-status-badge [status]="restaurant.userStatus" prefix="Usuario" />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                        Estado
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ restaurant.approvalStatus }}</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="usersIcon" aria-hidden="true"></lucide-angular>
                        Owner
                      </div>
                      <p class="mt-2 text-sm font-bold text-loreto-carbon">{{ restaurant.ownerFullName }}</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="calendarClockIcon" aria-hidden="true"></lucide-angular>
                        Registro
                      </div>
                      <p class="mt-2 text-sm font-bold text-loreto-carbon">{{ restaurant.createdAtUtc | date: 'shortDate' }}</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div class="flex items-center gap-2 text-sm text-text-muted">
                      <lucide-angular class="h-4 w-4 text-primary-700" [img]="calendarClockIcon" aria-hidden="true"></lucide-angular>
                      {{ restaurant.createdAtUtc | date: 'medium' }}
                    </div>
                    <app-button variant="secondary" size="lg" [routerLink]="['/admin/businesses', restaurant.restaurantId]">
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
export class AdminBusinessesPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminBusinessesApi = inject(AdminBusinessesApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly storeIcon = Store;
  readonly mapPinIcon = MapPin;
  readonly buildingIcon = Building2;
  readonly shieldCheckIcon = ShieldCheck;
  readonly usersIcon = Users;
  readonly calendarClockIcon = CalendarClock;

  readonly restaurants = signal<AdminBusinessListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly activeRestaurantsCount = computed(() => this.restaurants().filter((restaurant) => restaurant.isActive).length);
  readonly approvedRestaurantsCount = computed(() => this.restaurants().filter((restaurant) => restaurant.approvalStatus === 'Approved').length);
  readonly zonedRestaurantsCount = computed(() => this.restaurants().filter((restaurant) => !!restaurant.zoneName).length);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    approvalStatus: [''],
    isActive: [''],
    userStatus: [''],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadRestaurants();
    });

    this.loadRestaurants();
  }

  loadRestaurants(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminBusinessesApi
      .getBusinesses({
        q: filters.q,
        approvalStatus: filters.approvalStatus || undefined,
        isActive: this.toOptionalBoolean(filters.isActive),
        userStatus: filters.userStatus || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (restaurants) => {
          this.restaurants.set(restaurants);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los negocios.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
        approvalStatus: '',
        isActive: '',
        userStatus: '',
      },
      { emitEvent: false },
    );
    this.loadRestaurants();
  }

  private toOptionalBoolean(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return null;
  }
}


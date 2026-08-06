import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Bike,
  CalendarClock,
  FilterX,
  LucideAngularModule,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-angular';
import { debounceTime } from 'rxjs';
import { AdminDriverListItemResponse } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-drivers-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
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
    <section class="grid gap-5 lg:gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="Admin"
          title="Drivers"
          subtitle="Listado completo de drivers registrados en la red AppuraPe."
        />

        @if (errorMessage()) {
          <div class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {{ errorMessage() }}
          </div>
        }

        <app-notice
          tone="info"
          title="Disponibilidad y aprobación"
          message="Un driver solo puede operar si está aprobado y su usuario está activo. La disponibilidad indica si puede recibir o tomar pedidos."
        />

        <div class="stats-grid">
          <app-metric-card label="Drivers" [value]="drivers().length" helper="Registros visibles con los filtros actuales" />
          <app-metric-card label="Disponibles" [value]="availableDriversCount()" helper="Listos para pedidos o colaboración" />
          <app-metric-card label="De confianza" [value]="trustedDriversCount()" helper="Drivers con reputación consolidada" />
          <app-metric-card label="Promedio" [value]="averageTrustScore() + '%'" helper="Puntaje medio de confianza" />
        </div>
      </app-surface-card>

      <app-surface-card
        variant="page"
        extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]"
      >
        <form class="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_repeat(3,minmax(0,1fr))_auto]" [formGroup]="filtersForm" (ngSubmit)="loadDrivers()">
          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Buscar driver</span>
            <div class="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-500/15">
              <lucide-angular class="h-4 w-4 text-primary-700" [img]="searchIcon" aria-hidden="true"></lucide-angular>
              <input
                id="driverSearch"
                type="search"
                formControlName="q"
                placeholder="Nombre, email, phone, placa o zona"
                autocomplete="off"
                class="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none focus:ring-0"
              />
            </div>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Aprobación</span>
            <select id="approvalStatus" formControlName="approvalStatus">
              <option value="">Todos</option>
              <option value="Pending">Pendiente</option>
              <option value="Approved">Aprobado</option>
              <option value="Rejected">Rechazado</option>
            </select>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Disponible</span>
            <select id="isAvailable" formControlName="isAvailable">
              <option value="">Todos</option>
              <option value="true">Disponible</option>
              <option value="false">No disponible</option>
            </select>
          </label>

          <label class="grid gap-2">
            <span class="text-sm font-semibold text-loreto-carbon">Usuario</span>
            <select id="userStatus" formControlName="userStatus">
              <option value="">Todos</option>
              <option value="Pending">Pendiente</option>
              <option value="Active">Activo</option>
              <option value="Suspended">Suspendido</option>
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
          Cargando drivers...
        </div>
      } @else if (!drivers().length) {
        <app-surface-card variant="page">
          <div class="grid gap-4">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-500">
              No hay drivers con los filtros seleccionados.
            </div>
            <div class="flex flex-wrap gap-3">
              <app-button size="lg" type="button" (click)="clearFilters()">Limpiar filtros</app-button>
              <app-button variant="ghost" [routerLink]="'/admin/dashboard'">Volver al inicio</app-button>
            </div>
          </div>
        </app-surface-card>
      } @else {
        <div class="grid gap-4">
          @for (driver of drivers(); track driver.driverId) {
            <app-surface-card variant="page">
              <div class="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-start">
                <div class="grid gap-4">
                  <div class="flex items-start gap-4">
                    <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                      <lucide-angular class="h-6 w-6" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                    </div>
                    <div class="grid gap-1">
                      <strong class="text-lg font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.fullName }}</strong>
                      <span class="text-sm text-text-muted">{{ driver.email }} · {{ driver.phone }}</span>
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                        Vehículo
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver.vehicleType }} - {{ driver.plate }}</p>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                        Zona
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver.zoneName }}</p>
                    </div>
                  </div>
                </div>

                <div class="grid gap-4">
                  <div class="flex flex-wrap items-center gap-2">
                    <app-status-badge [status]="driver.approvalStatus" prefix="Aprobación" />
                    <app-status-badge [status]="driver.isAvailable" [label]="driver.isAvailable ? 'Disponible' : 'No disponible'" />
                    <app-status-badge [status]="driver.trustLevel" prefix="Confianza" [label]="trustLevelLabel(driver.trustLevel)" />
                    <app-status-badge [status]="driver.userStatus" prefix="Usuario" />
                  </div>

                  <div class="grid gap-3 min-[390px]:grid-cols-2 xl:grid-cols-3">
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                        Puntaje
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.trustScore }}%</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                        Rating
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.averageRating | number:'1.1-1' }}/5</p>
                    </div>
                    <div class="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="usersIcon" aria-hidden="true"></lucide-angular>
                        Entregas
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.completedDeliveriesCount }}</p>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div class="flex items-center gap-2 text-sm text-text-muted">
                      <lucide-angular class="h-4 w-4 text-primary-700" [img]="calendarClockIcon" aria-hidden="true"></lucide-angular>
                      {{ driver.createdAtUtc | date: 'medium' }}
                    </div>
                    <app-button variant="secondary" size="lg" [routerLink]="['/admin/drivers', driver.driverId]">
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
export class AdminDriversPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchIcon = Search;
  readonly filterXIcon = FilterX;
  readonly bikeIcon = Bike;
  readonly mapPinIcon = MapPin;
  readonly shieldCheckIcon = ShieldCheck;
  readonly starIcon = Star;
  readonly usersIcon = Users;
  readonly calendarClockIcon = CalendarClock;

  readonly drivers = signal<AdminDriverListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly availableDriversCount = computed(() => this.drivers().filter((driver) => driver.isAvailable).length);
  readonly trustedDriversCount = computed(() => this.drivers().filter((driver) => driver.trustLevel === 'Trusted').length);
  readonly averageTrustScore = computed(() => {
    const drivers = this.drivers();

    if (!drivers.length) {
      return 0;
    }

    return Math.round(drivers.reduce((total, driver) => total + driver.trustScore, 0) / drivers.length);
  });

  readonly filtersForm = this.formBuilder.nonNullable.group({
    q: [''],
    approvalStatus: [''],
    isAvailable: [''],
    userStatus: [''],
  });

  constructor() {
    this.filtersForm.valueChanges.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadDrivers();
    });

    this.loadDrivers();
  }

  loadDrivers(): void {
    const filters = this.filtersForm.getRawValue();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getDrivers({
        q: filters.q,
        approvalStatus: filters.approvalStatus || undefined,
        isAvailable: this.toOptionalBoolean(filters.isAvailable),
        userStatus: filters.userStatus || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los drivers.'));
          this.isLoading.set(false);
        },
      });
  }

  clearFilters(): void {
    this.filtersForm.reset(
      {
        q: '',
        approvalStatus: '',
        isAvailable: '',
        userStatus: '',
      },
      { emitEvent: false },
    );
    this.loadDrivers();
  }

  trustLevelLabel(trustLevel: string): string {
    switch (trustLevel) {
      case 'Trusted':
        return 'De confianza';
      case 'Verified':
        return 'Verificado';
      default:
        return 'Sin nivel';
    }
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

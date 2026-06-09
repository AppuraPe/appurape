import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  Bike,
  CircleCheckBig,
  CircleX,
  LucideAngularModule,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-angular';
import { PendingDriverResponse } from '../../core/models/driver.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-pending-drivers-page',
  standalone: true,
  imports: [
    DecimalPipe,
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
          title="Drivers pendientes"
          subtitle="Valida nuevos colaboradores de reparto antes de darles acceso operativo dentro de la red."
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
          title="Acceso operativo controlado"
          message="Aprobar habilita al driver para tomar pedidos y tareas comunitarias. Rechazar mantiene la cuenta fuera de operacion mientras se revisa su documentacion."
        />

        <div class="stats-grid">
          <app-metric-card label="Pendientes" [value]="drivers().length" helper="Drivers esperando aprobacion" />
          <app-metric-card label="Disponibles" [value]="availableDriversCount()" helper="Perfiles que ya se marcaron como disponibles" />
          <app-metric-card label="Confiables" [value]="trustedDriversCount()" helper="Drivers que llegan con historial alto" />
          <app-metric-card label="Rating medio" [value]="averageRatingLabel()" helper="Promedio de calidad de servicio" />
        </div>
      </app-surface-card>

      <app-surface-card variant="page" extraClass="bg-gradient-to-br from-white via-[#fff8f6] to-[#fff0ed]">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="grid gap-1">
            <span class="text-xs font-black uppercase tracking-[0.18em] text-primary-700">Cola de aprobacion</span>
            <p class="text-sm text-text-muted">Verifica disponibilidad, documentos y nivel de confianza antes de activar.</p>
          </div>
          <app-button variant="ghost" [disabled]="isLoading() || !!actionDriverId()" (click)="loadDrivers()">
            <lucide-angular class="h-4 w-4" [img]="refreshIcon" aria-hidden="true"></lucide-angular>
            Recargar
          </app-button>
        </div>
      </app-surface-card>

      @if (isLoading()) {
        <div class="rounded-[28px] border border-[#eddad4] bg-white px-6 py-5 text-sm font-semibold text-text-muted shadow-[0_12px_28px_rgba(6,25,43,0.08)]">
          Cargando drivers pendientes...
        </div>
      } @else if (!drivers().length) {
        <app-surface-card variant="page">
          <div class="grid gap-5 text-center md:justify-items-center">
            <div class="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-[0_12px_28px_rgba(16,185,129,0.14)]">
              <lucide-angular class="h-8 w-8" [img]="circleCheckIcon" aria-hidden="true"></lucide-angular>
            </div>
            <div class="grid gap-2">
              <h2 class="text-2xl font-black tracking-[-0.04em] text-loreto-carbon">No hay drivers pendientes</h2>
              <p class="max-w-2xl text-sm leading-6 text-text-muted md:text-base">
                La cola de aprobacion esta despejada. Puedes revisar el listado general o volver al dashboard administrativo.
              </p>
            </div>
            <div class="flex flex-wrap justify-center gap-3">
              <app-button size="lg" [routerLink]="'/admin/drivers'">Ver todos los drivers</app-button>
              <app-button size="lg" variant="ghost" [routerLink]="'/admin/dashboard'">Volver al dashboard</app-button>
            </div>
          </div>
        </app-surface-card>
      } @else {
        <div class="grid gap-4">
          @for (driver of drivers(); track driver.id) {
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
                    <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                        Vehiculo
                      </div>
                      <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver.vehicleType }} - {{ driver.plate }}</p>
                    </div>

                    <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3">
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
                    <app-status-badge [status]="driver.approvalStatus" prefix="Aprobacion" />
                    <app-status-badge [status]="driver.isAvailable" [label]="driver.isAvailable ? 'Disponible' : 'No disponible'" />
                    <app-status-badge [status]="driver.trustLevel" prefix="Confianza" [label]="trustLevelLabel(driver.trustLevel)" />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-3">
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                        Puntaje
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.trustScore }}%</p>
                    </div>
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                        Rating
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.averageRating | number:'1.1-1' }}/5</p>
                    </div>
                    <div class="rounded-2xl border border-[#eddad4] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                      <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                        <lucide-angular class="h-4 w-4" [img]="usersIcon" aria-hidden="true"></lucide-angular>
                        Entregas
                      </div>
                      <p class="mt-2 text-xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver.completedDeliveriesCount }}</p>
                    </div>
                  </div>

                  <div class="grid gap-3 rounded-2xl border border-[#eddad4] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(6,25,43,0.06)]">
                    <div class="rounded-2xl border border-[#eddad4] bg-surface-soft px-4 py-3 text-sm text-text-muted">
                      Este perfil esta en espera de aprobacion administrativa para empezar a operar en pedidos y colaboraciones.
                    </div>

                    <div class="flex flex-wrap gap-3">
                      <button
                        type="button"
                        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-primary-700/20 transition duration-150 hover:-translate-y-0.5 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-55"
                        (click)="approveDriver(driver)"
                        [disabled]="actionDriverId() === driver.id"
                      >
                        <lucide-angular class="h-4 w-4" [img]="circleCheckIcon" aria-hidden="true"></lucide-angular>
                        {{ actionDriverId() === driver.id ? 'Procesando...' : 'Aprobar' }}
                      </button>
                      <button
                        type="button"
                        class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-danger px-5 text-sm font-extrabold text-white shadow-lg shadow-red-900/10 transition duration-150 hover:bg-[#a50f19] disabled:cursor-not-allowed disabled:opacity-55"
                        (click)="rejectDriver(driver)"
                        [disabled]="actionDriverId() === driver.id"
                      >
                        <lucide-angular class="h-4 w-4" [img]="circleXIcon" aria-hidden="true"></lucide-angular>
                        Rechazar
                      </button>
                      <app-button variant="secondary" size="md" [routerLink]="['/admin/drivers', driver.id]">
                        Ver detalle
                      </app-button>
                    </div>
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
export class AdminPendingDriversPageComponent {
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly refreshIcon = RefreshCw;
  readonly bikeIcon = Bike;
  readonly mapPinIcon = MapPin;
  readonly shieldCheckIcon = ShieldCheck;
  readonly starIcon = Star;
  readonly usersIcon = Users;
  readonly circleCheckIcon = CircleCheckBig;
  readonly circleXIcon = CircleX;

  readonly drivers = signal<PendingDriverResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly actionDriverId = signal<string | null>(null);
  readonly availableDriversCount = computed(() => this.drivers().filter((driver) => driver.isAvailable).length);
  readonly trustedDriversCount = computed(() => this.drivers().filter((driver) => driver.trustLevel === 'Trusted').length);
  readonly averageRatingLabel = computed(() => {
    const drivers = this.drivers();

    if (!drivers.length) {
      return '0.0/5';
    }

    const average = drivers.reduce((total, driver) => total + driver.averageRating, 0) / drivers.length;
    return `${average.toFixed(1)}/5`;
  });

  constructor() {
    this.loadDrivers();
  }

  loadDrivers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getPendingDrivers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drivers) => {
          this.drivers.set(drivers);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar los drivers pendientes.'));
          this.isLoading.set(false);
        },
      });
  }

  approveDriver(driver: PendingDriverResponse): void {
    this.runDriverAction(driver.id, driver.fullName, 'aprobo', () => this.adminApi.approveDriver(driver.id));
  }

  rejectDriver(driver: PendingDriverResponse): void {
    this.runDriverAction(driver.id, driver.fullName, 'rechazo', () => this.adminApi.rejectDriver(driver.id));
  }

  private runDriverAction(
    id: string,
    fullName: string,
    actionLabel: string,
    request: () => ReturnType<AdminApiService['approveDriver']>,
  ): void {
    this.actionDriverId.set(id);
    this.errorMessage.set('');
    this.successMessage.set('');

    request()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.successMessage.set(`Se ${actionLabel} el driver ${fullName}.`);
          this.actionDriverId.set(null);
          this.loadDrivers();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo actualizar el driver ${fullName}.`));
          this.actionDriverId.set(null);
        },
      });
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
}

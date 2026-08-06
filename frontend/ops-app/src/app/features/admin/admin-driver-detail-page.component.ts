import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Bike,
  CalendarClock,
  Camera,
  FileBadge2,
  LucideAngularModule,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-angular';
import { AdminDriverDetailResponse, AdminStatusAction } from '../../core/models/admin.models';
import { AdminApiService } from '../../core/services/admin-api.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';

@Component({
  selector: 'app-admin-driver-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    LucideAngularModule,
    PageHeaderComponent,
    AppNoticeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-6">
      <app-surface-card variant="page">
        <app-page-header
          eyebrow="Admin"
          title="Detalle de driver"
          subtitle="Información administrativa, evidencia documental y nivel de confianza."
        />

        <div class="flex flex-wrap gap-3">
          <app-button variant="ghost" [routerLink]="'/admin/drivers'">Volver a drivers</app-button>
          <app-button variant="secondary" [routerLink]="'/admin/drivers/pending'">Pendientes</app-button>
        </div>

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

        @if (isLoading()) {
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            Cargando driver...
          </div>
        } @else if (driver()) {
          <app-notice
            tone="warning"
            title="Impacto de las acciones"
            message="Approve habilita al driver, Trust lo eleva a colaborador de confianza, Verify lo devuelve al nivel verificado, Reject impide operar, Suspend bloquea temporalmente y Reactivate devuelve el acceso si el estado lo permite."
          />

          <div class="stats-grid">
            <app-metric-card label="Aprobación" [value]="driver()!.approvalStatus" helper="Estado operativo principal" />
            <app-metric-card label="Disponible" [value]="driver()!.isAvailable ? 'Disponible' : 'No disponible'" helper="Capacidad actual para tomar pedidos" />
            <app-metric-card label="Confianza" [value]="trustLevelLabel(driver()!.trustLevel)" helper="Nivel reputacional actual" />
            <app-metric-card label="Puntaje" [value]="driver()!.trustScore + '%'" helper="Score consolidado por entregas y rating" />
            <app-metric-card label="Promedio" [value]="(driver()!.averageRating | number:'1.1-1') + '/5'" helper="Calificación media del cliente" />
            <app-metric-card label="Entregas" [value]="driver()!.completedDeliveriesCount" helper="Operaciones completadas" />
          </div>

          <div class="flex flex-wrap gap-3">
            @for (action of moderationActions; track action.value) {
              <app-button
                [variant]="action.value === 'reject' || action.value === 'suspend' ? 'danger' : 'primary'"
                size="lg"
                type="button"
                [disabled]="actionInProgress() === action.value"
                (click)="updateStatus(action.value)"
              >
                {{ actionInProgress() === action.value ? 'Procesando...' : action.label }}
              </app-button>
            }
          </div>

          @if (driver()!.approvalStatus === 'Approved' && driver()!.userStatus === 'Active') {
            <div class="flex flex-wrap gap-3">
              @for (action of trustActions; track action.value) {
                <app-button
                  variant="secondary"
                  size="lg"
                  type="button"
                  [disabled]="actionInProgress() === action.value"
                  (click)="updateStatus(action.value)"
                >
                  {{ actionInProgress() === action.value ? 'Procesando...' : action.label }}
                </app-button>
              }
            </div>
          }
        }
      </app-surface-card>

      @if (driver()) {
        <div class="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <app-surface-card variant="page">
            <div class="grid gap-5">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="bikeIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="grid gap-1">
                  <h2 class="mb-0 text-2xl font-black tracking-[-0.03em] text-loreto-carbon">{{ driver()!.fullName }}</h2>
                  <p class="text-sm text-text-muted">{{ driver()!.vehicleType }} - {{ driver()!.plate }}</p>
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mailIcon" aria-hidden="true"></lucide-angular>
                    Email
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver()!.email }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="phoneIcon" aria-hidden="true"></lucide-angular>
                    Teléfono
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver()!.phone }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="mapPinIcon" aria-hidden="true"></lucide-angular>
                    Zona
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver()!.zoneName }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="trophyIcon" aria-hidden="true"></lucide-angular>
                    Usuario
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver()!.userStatus }}</p>
                </div>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                  <lucide-angular class="h-4 w-4" [img]="starIcon" aria-hidden="true"></lucide-angular>
                  Regla de confianza
                </div>
                <p class="mt-3 text-sm leading-6 text-text-muted">
                  Cada entrega completada suma 10 puntos hasta 100. La nota promedio del cliente ajusta el score y con 70 o mas el colaborador pasa a Trusted.
                </p>
              </div>
            </div>
          </app-surface-card>

          <app-surface-card variant="page">
            <div class="grid gap-5">
              <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-primary-700">
                <lucide-angular class="h-4 w-4" [img]="shieldCheckIcon" aria-hidden="true"></lucide-angular>
                Evidencia y trazabilidad
              </div>

              <div class="grid gap-4 xl:grid-cols-2">
                <div class="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="fileIcon" aria-hidden="true"></lucide-angular>
                    Documento identidad
                  </div>
                  @if (driver()!.identityDocumentUrl) {
                    <div class="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                      <img class="block h-56 w-full object-cover" [src]="driver()!.identityDocumentUrl" [alt]="driver()!.fullName + ' documento'" />
                    </div>
                    <div class="mt-3">
                      <a class="font-extrabold text-primary-700 no-underline hover:text-primary-600" [href]="driver()!.identityDocumentUrl" target="_blank" rel="noreferrer">
                        Abrir documento
                      </a>
                    </div>
                  } @else {
                    <div class="mt-3 grid min-h-44 place-items-center rounded-[20px] border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                      Sin documento cargado.
                    </div>
                  }
                </div>

                <div class="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="cameraIcon" aria-hidden="true"></lucide-angular>
                    Foto vehículo
                  </div>
                  @if (driver()!.vehiclePhotoUrl) {
                    <div class="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-50">
                      <img class="block h-56 w-full object-cover" [src]="driver()!.vehiclePhotoUrl" [alt]="driver()!.fullName + ' vehículo'" />
                    </div>
                    <div class="mt-3">
                      <a class="font-extrabold text-primary-700 no-underline hover:text-primary-600" [href]="driver()!.vehiclePhotoUrl" target="_blank" rel="noreferrer">
                        Abrir foto
                      </a>
                    </div>
                  } @else {
                    <div class="mt-3 grid min-h-44 place-items-center rounded-[20px] border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
                      Sin foto de vehículo cargada.
                    </div>
                  }
                </div>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="calendarIcon" aria-hidden="true"></lucide-angular>
                    Creado
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">{{ driver()!.createdAtUtc | date: 'medium' }}</p>
                </div>
                <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div class="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-primary-700">
                    <lucide-angular class="h-4 w-4" [img]="calendarIcon" aria-hidden="true"></lucide-angular>
                    Actualizado
                  </div>
                  <p class="mt-2 text-sm font-semibold text-loreto-carbon">
                    {{ driver()!.updatedAtUtc ? (driver()!.updatedAtUtc | date: 'medium') : 'Sin cambios' }}
                  </p>
                </div>
              </div>
            </div>
          </app-surface-card>
        </div>
      }
    </section>
  `,
})
export class AdminDriverDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminApi = inject(AdminApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bikeIcon = Bike;
  readonly mailIcon = Mail;
  readonly phoneIcon = Phone;
  readonly mapPinIcon = MapPin;
  readonly fileIcon = FileBadge2;
  readonly cameraIcon = Camera;
  readonly shieldCheckIcon = ShieldCheck;
  readonly starIcon = Star;
  readonly trophyIcon = Trophy;
  readonly calendarIcon = CalendarClock;

  readonly moderationActions: Array<{ label: string; value: AdminStatusAction }> = [
    { label: 'Approve', value: 'approve' },
    { label: 'Reject', value: 'reject' },
    { label: 'Suspend', value: 'suspend' },
    { label: 'Reactivate', value: 'reactivate' },
  ];

  readonly trustActions: Array<{ label: string; value: AdminStatusAction }> = [
    { label: 'Marcar como de confianza', value: 'trust' },
    { label: 'Volver a verificado', value: 'verify' },
  ];

  readonly driver = signal<AdminDriverDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly actionInProgress = signal<AdminStatusAction | null>(null);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  private readonly driverId = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.loadDriver();
  }

  loadDriver(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminApi
      .getDriverById(this.driverId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (driver) => {
          this.driver.set(driver);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el driver.'));
          this.isLoading.set(false);
        },
      });
  }

  updateStatus(action: AdminStatusAction): void {
    this.actionInProgress.set(action);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminApi
      .updateDriverStatus(this.driverId, action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (driver) => {
          this.driver.set(driver);
          this.successMessage.set(`Accion ${action} aplicada correctamente.`);
          this.actionInProgress.set(null);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, `No se pudo aplicar la acción ${action}.`));
          this.actionInProgress.set(null);
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

import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import {
  CommunityCollaboratorResponse,
  CommunityRequestListItemResponse,
  CommunityRouteResponse,
} from '../../core/models/community.models';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-community-hub-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    AppBackButtonComponent,
    PageHeaderComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
  ],
  template: `
    <section class="grid gap-5">
      <app-back-button fallbackUrl="/businesses" label="Volver a negocios" />

      <app-surface-card variant="page">
        <app-page-header
          eyebrow="AppuraPe Favores"
          title="Red de favores"
          subtitle="Activa tu disponibilidad, registra trayectos y gestiona solicitudes compensadas desde una vista más simple."
        />

        <app-notice
          tone="info"
          title="Cómo funciona"
          message="La reputación comunitaria es independiente del delivery tradicional y mejora con cumplimiento real, confirmación y buena calificación."
        />

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        } @else if (isLoading()) {
          <div class="message">Cargando red comunitaria...</div>
        } @else if (collaborator()) {
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <app-metric-card label="Nivel" [value]="collaborator()!.collaborationLevel" helper="Confianza separada del delivery profesional" />
            <app-metric-card label="Puntaje" [value]="(collaborator()!.trustScore | number:'1.0-0') + '%'" helper="Sube con cumplimiento real" />
            <app-metric-card label="Colaboraciones" [value]="collaborator()!.completedCollaborations.toString()" helper="Tareas completadas" />
            <app-metric-card label="Calificación" [value]="(collaborator()!.collaborationRating | number:'1.1-1') + '/5'" helper="Promedio de experiencias" />
          </div>

          <div class="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <app-surface-card variant="soft">
              <form class="grid gap-4" [formGroup]="availabilityForm" (ngSubmit)="saveAvailability()">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="mb-1 text-[1.35rem] font-black tracking-[-0.04em] text-loreto-carbon">Disponibilidad</h2>
                    <p class="text-sm leading-5.5 text-text-muted">Controla cuándo apareces como colaborador disponible.</p>
                  </div>
                  <app-status-badge [status]="collaborator()!.availabilityStatus" prefix="Estado" />
                </div>

                <label>
                  <span>Activo</span>
                  <input type="checkbox" formControlName="isAvailable" />
                </label>
                <label>
                  <span>Estado</span>
                  <select formControlName="availabilityStatus">
                    <option value="Disconnected">Desconectado</option>
                    <option value="Available">Disponible</option>
                    <option value="Busy">Ocupado</option>
                  </select>
                </label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span>Latitud actual</span>
                    <input type="number" step="0.000001" formControlName="currentLatitude" />
                  </label>
                  <label>
                    <span>Longitud actual</span>
                    <input type="number" step="0.000001" formControlName="currentLongitude" />
                  </label>
                </div>
                <label>
                  <span>Radio de cobertura (km)</span>
                  <input type="number" step="0.1" min="1" formControlName="availabilityRadiusKm" />
                </label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span>Disponible desde</span>
                    <input type="datetime-local" formControlName="availableFromUtc" />
                  </label>
                  <label>
                    <span>Disponible hasta</span>
                    <input type="datetime-local" formControlName="availableUntilUtc" />
                  </label>
                </div>
                <app-button type="submit" [disabled]="isSavingAvailability()" block>
                  {{ isSavingAvailability() ? 'Guardando...' : 'Guardar disponibilidad' }}
                </app-button>
              </form>
            </app-surface-card>

            <app-surface-card variant="soft">
              <form class="grid gap-4" [formGroup]="requestForm" (ngSubmit)="createRequest()">
                <div class="min-w-0">
                  <h2 class="mb-1 text-[1.35rem] font-black tracking-[-0.04em] text-loreto-carbon">Nueva solicitud</h2>
                  <p class="text-sm leading-5.5 text-text-muted">Publica una tarea compensada para la red comunitaria.</p>
                </div>
                <label>
                  <span>Tipo</span>
                  <select formControlName="type">
                    <option value="MarketPurchase">Compra de mercado</option>
                    <option value="Errand">Encargo</option>
                    <option value="ProductPickup">Recojo de productos</option>
                    <option value="PackageDelivery">Entrega de paquetes</option>
                    <option value="CompensatedFavor">Favor compensado</option>
                  </select>
                </label>
                <label>
                  <span>Título</span>
                  <input type="text" formControlName="title" />
                </label>
                <label>
                  <span>Descripción</span>
                  <textarea rows="3" formControlName="description"></textarea>
                </label>
                <label>
                  <span>Origen</span>
                  <input type="text" formControlName="originLabel" />
                </label>
                <label>
                  <span>Destino</span>
                  <input type="text" formControlName="destinationLabel" />
                </label>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span>Latitud origen</span>
                    <input type="number" step="0.000001" formControlName="originLatitude" />
                  </label>
                  <label>
                    <span>Longitud origen</span>
                    <input type="number" step="0.000001" formControlName="originLongitude" />
                  </label>
                  <label>
                    <span>Latitud destino</span>
                    <input type="number" step="0.000001" formControlName="destinationLatitude" />
                  </label>
                  <label>
                    <span>Longitud destino</span>
                    <input type="number" step="0.000001" formControlName="destinationLongitude" />
                  </label>
                </div>
                <div class="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span>Compensación</span>
                    <input type="number" step="0.01" min="0" formControlName="compensationAmount" />
                  </label>
                  <label>
                    <span>Fecha límite</span>
                    <input type="datetime-local" formControlName="deadlineUtc" />
                  </label>
                </div>
                <app-button type="submit" [disabled]="isCreatingRequest()" block>
                  {{ isCreatingRequest() ? 'Publicando...' : 'Publicar solicitud' }}
                </app-button>
              </form>
            </app-surface-card>
          </div>
        }
      </app-surface-card>

      <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <app-surface-card variant="page" extraClass="stack">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="mb-1 text-[1.35rem] font-black tracking-[-0.04em] text-loreto-carbon">Mis trayectos</h2>
              <p class="text-sm leading-5.5 text-text-muted">Mejoran el matching cuando ya tienes una ruta habitual.</p>
            </div>
            @if (routeEditingId()) {
              <app-button variant="ghost" type="button" (click)="routeEditingId.set(null); routeForm.reset({ originLabel: '', originLatitude: 0, originLongitude: 0, destinationLabel: '', destinationLatitude: 0, destinationLongitude: 0, estimatedMinutes: 30, deviationRadiusKm: 3, isActive: true })">
                Limpiar edición
              </app-button>
            }
          </div>

          <form class="grid gap-4" [formGroup]="routeForm" (ngSubmit)="saveRoute()">
            <label><span>Origen</span><input type="text" formControlName="originLabel" /></label>
            <label><span>Destino</span><input type="text" formControlName="destinationLabel" /></label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label><span>Latitud origen</span><input type="number" step="0.000001" formControlName="originLatitude" /></label>
              <label><span>Longitud origen</span><input type="number" step="0.000001" formControlName="originLongitude" /></label>
              <label><span>Latitud destino</span><input type="number" step="0.000001" formControlName="destinationLatitude" /></label>
              <label><span>Longitud destino</span><input type="number" step="0.000001" formControlName="destinationLongitude" /></label>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <label><span>Tiempo estimado (min)</span><input type="number" min="1" formControlName="estimatedMinutes" /></label>
              <label><span>Desvío permitido (km)</span><input type="number" step="0.1" min="1" formControlName="deviationRadiusKm" /></label>
            </div>
            <label><span>Activo</span><input type="checkbox" formControlName="isActive" /></label>
            <app-button variant="secondary" type="submit" [disabled]="isSavingRoute()" block>
              {{ isSavingRoute() ? 'Guardando...' : routeEditingId() ? 'Actualizar trayecto' : 'Guardar trayecto' }}
            </app-button>
          </form>

          @if (!routes().length) {
            <div class="message">Aún no tienes trayectos registrados.</div>
          } @else {
            <div class="grid gap-3">
              @for (route of routes(); track route.id) {
                <button class="list-card text-left" type="button" (click)="editRoute(route)">
                  <strong>{{ route.originLabel }} → {{ route.destinationLabel }}</strong>
                  <span class="muted">{{ route.estimatedMinutes }} min · Desvío {{ route.deviationRadiusKm }} km</span>
                  <app-status-badge [status]="route.isActive" [label]="route.isActive ? 'Activo' : 'Inactivo'" />
                </button>
              }
            </div>
          }
        </app-surface-card>

        <app-surface-card variant="page" extraClass="stack">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="mb-1 text-[1.35rem] font-black tracking-[-0.04em] text-loreto-carbon">Solicitudes</h2>
              <p class="text-sm leading-5.5 text-text-muted">Tareas publicadas por la red o asignadas directamente a ti.</p>
            </div>
            <app-button variant="ghost" type="button" [disabled]="isLoading()" (click)="loadHub()">Recargar</app-button>
          </div>

          @if (!requests().length) {
            <div class="message">No hay solicitudes comunitarias todavía.</div>
          } @else {
            <div class="grid gap-3">
              @for (request of requests(); track request.id) {
                <a class="list-card" [routerLink]="['/community/requests', request.id]">
                  <strong>{{ request.title }}</strong>
                  <span class="muted">{{ request.type }} · {{ request.originLabel }} → {{ request.destinationLabel }}</span>
                  <span class="muted">{{ request.compensationAmount | currency:'PEN':'symbol-narrow':'1.2-2' }} · Match {{ request.matchScore | number:'1.0-0' }}%</span>
                  <div class="inline-status">
                    <app-status-badge [status]="request.status" />
                    @if (request.isMine) {
                      <app-status-badge status="verified" label="Mía" />
                    }
                    @if (request.isAssignedToMe) {
                      <app-status-badge status="trusted" label="Asignada" />
                    }
                  </div>
                </a>
              }
            </div>
          }
        </app-surface-card>
      </div>
    </section>
  `,
})
export class CommunityHubPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly communityApi = inject(CommunityApiService);
  private readonly authService = inject(AuthService);

  readonly collaborator = signal<CommunityCollaboratorResponse | null>(null);
  readonly routes = signal<CommunityRouteResponse[]>([]);
  readonly requests = signal<CommunityRequestListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isSavingAvailability = signal(false);
  readonly isSavingRoute = signal(false);
  readonly isCreatingRequest = signal(false);
  readonly errorMessage = signal('');
  readonly routeEditingId = signal<string | null>(null);
  readonly currentUserId = computed(() => this.authService.currentUser()?.userId ?? null);

  readonly availabilityForm = this.formBuilder.nonNullable.group({
    isAvailable: false,
    availabilityStatus: 'Disconnected',
    currentLatitude: [null as number | null],
    currentLongitude: [null as number | null],
    availabilityRadiusKm: [5, [Validators.required, Validators.min(1)]],
    availableFromUtc: '',
    availableUntilUtc: '',
  });

  readonly routeForm = this.formBuilder.nonNullable.group({
    originLabel: ['', Validators.required],
    originLatitude: [0, Validators.required],
    originLongitude: [0, Validators.required],
    destinationLabel: ['', Validators.required],
    destinationLatitude: [0, Validators.required],
    destinationLongitude: [0, Validators.required],
    estimatedMinutes: [30, [Validators.required, Validators.min(1)]],
    deviationRadiusKm: [3, [Validators.required, Validators.min(1)]],
    isActive: true,
  });

  readonly requestForm = this.formBuilder.nonNullable.group({
    type: 'MarketPurchase',
    title: ['', Validators.required],
    description: ['', Validators.required],
    originLabel: ['', Validators.required],
    originLatitude: [null as number | null],
    originLongitude: [null as number | null],
    destinationLabel: ['', Validators.required],
    destinationLatitude: [null as number | null],
    destinationLongitude: [null as number | null],
    compensationAmount: [0, [Validators.required, Validators.min(0)]],
    deadlineUtc: '',
  });

  constructor() {
    this.loadHub();
  }

  loadHub(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      collaborator: this.communityApi.getMyCollaborator(),
      routes: this.communityApi.getMyRoutes(),
      requests: this.communityApi.getRequests(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ collaborator, routes, requests }) => {
          this.collaborator.set(collaborator);
          this.routes.set(routes);
          this.requests.set(requests);
          this.availabilityForm.patchValue({
            isAvailable: collaborator.isAvailable,
            availabilityStatus: collaborator.availabilityStatus,
            currentLatitude: collaborator.currentLatitude ?? null,
            currentLongitude: collaborator.currentLongitude ?? null,
            availabilityRadiusKm: collaborator.availabilityRadiusKm,
            availableFromUtc: this.toLocalDateTime(collaborator.availableFromUtc),
            availableUntilUtc: this.toLocalDateTime(collaborator.availableUntilUtc),
          });
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el modulo comunitario.'));
          this.isLoading.set(false);
        },
      });
  }

  saveAvailability(): void {
    if (this.availabilityForm.invalid) {
      this.availabilityForm.markAllAsTouched();
      return;
    }

    this.isSavingAvailability.set(true);
    this.communityApi
      .updateMyCollaborator({
        ...this.availabilityForm.getRawValue(),
        availableFromUtc: this.toUtcString(this.availabilityForm.controls.availableFromUtc.value),
        availableUntilUtc: this.toUtcString(this.availabilityForm.controls.availableUntilUtc.value),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (collaborator) => {
          this.collaborator.set(collaborator);
          this.isSavingAvailability.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo guardar la disponibilidad.'));
          this.isSavingAvailability.set(false);
        },
      });
  }

  saveRoute(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    this.isSavingRoute.set(true);
    const request = this.routeForm.getRawValue();
    const operation = this.routeEditingId()
      ? this.communityApi.updateRoute(this.routeEditingId()!, request)
      : this.communityApi.createRoute(request);

    operation.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.routeEditingId.set(null);
        this.routeForm.reset({
          originLabel: '',
          originLatitude: 0,
          originLongitude: 0,
          destinationLabel: '',
          destinationLatitude: 0,
          destinationLongitude: 0,
          estimatedMinutes: 30,
          deviationRadiusKm: 3,
          isActive: true,
        });
        this.isSavingRoute.set(false);
        this.loadHub();
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudo guardar el trayecto.'));
        this.isSavingRoute.set(false);
      },
    });
  }

  editRoute(route: CommunityRouteResponse): void {
    this.routeEditingId.set(route.id);
    this.routeForm.patchValue({
      originLabel: route.originLabel,
      originLatitude: route.originLatitude,
      originLongitude: route.originLongitude,
      destinationLabel: route.destinationLabel,
      destinationLatitude: route.destinationLatitude,
      destinationLongitude: route.destinationLongitude,
      estimatedMinutes: route.estimatedMinutes,
      deviationRadiusKm: route.deviationRadiusKm,
      isActive: route.isActive,
    });
  }

  createRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isCreatingRequest.set(true);
    this.communityApi
      .createRequest({
        ...this.requestForm.getRawValue(),
        deadlineUtc: this.toUtcString(this.requestForm.controls.deadlineUtc.value),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.requestForm.reset({
            type: 'MarketPurchase',
            title: '',
            description: '',
            originLabel: '',
            originLatitude: null,
            originLongitude: null,
            destinationLabel: '',
            destinationLatitude: null,
            destinationLongitude: null,
            compensationAmount: 0,
            deadlineUtc: '',
          });
          this.isCreatingRequest.set(false);
          this.loadHub();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo publicar la solicitud.'));
          this.isCreatingRequest.set(false);
        },
      });
  }

  private toUtcString(value: string | null): string | null {
    return value ? new Date(value).toISOString() : null;
  }

  private toLocalDateTime(value?: string | null): string {
    if (!value) {
      return '';
    }

    return new Date(value).toISOString().slice(0, 16);
  }
}

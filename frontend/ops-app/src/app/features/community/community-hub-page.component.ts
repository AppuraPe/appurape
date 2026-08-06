import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import {
  CommunityCollaboratorResponse,
  CommunityRequestListItemResponse,
  CommunityRouteResponse,
} from '../../core/models/community.models';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { ActionChipRowComponent } from '../../shared/components/action-chip-row.component';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

type RequestScope = 'all' | 'mine' | 'available';
type HubWarning = { title: string; message: string };
type HubLoadResult<T> = { data: T; warning: HubWarning | null };

@Component({
  selector: 'app-community-hub-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    AppBackButtonComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppMetricCardComponent,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    ActionChipRowComponent,
  ],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      extraClass="space-y-4 px-4 pt-4 sm:px-5 lg:px-0 lg:pt-0"
      bottomSpacingClass="pb-[calc(118px+env(safe-area-inset-bottom,0px))]"
    >
      <app-back-button fallbackUrl="/businesses" label="Volver a negocios" />

      <app-surface-card variant="page" extraClass="grid gap-4 p-5">
        <app-internal-page-section-header
          eyebrow="Community"
          title="Favores y encargos"
          subtitle="Publica un favor, revisa solicitudes disponibles y coordina entregas rápidas desde una experiencia móvil más clara."
          meta="MVP"
        />

        <app-notice
          tone="info"
          title="Cómo funciona"
          message="Los favores se coordinan aparte del delivery tradicional. Puedes pedir ayuda, ofrecerte como colaborador y confirmar la entrega desde el mismo módulo."
        />

        <div class="grid gap-3 min-[390px]:grid-cols-2 xl:grid-cols-4">
          <app-metric-card label="Disponibilidad" [value]="availabilitySummary()" helper="Tu estado actual como colaborador" />
          <app-metric-card label="Solicitudes" [value]="requests().length.toString()" helper="Favores visibles para tu cuenta" />
          <app-metric-card label="Completadas" [value]="completedRequestsCount().toString()" helper="Solicitudes cerradas correctamente" />
          <app-metric-card label="Confianza" [value]="trustSummary()" helper="Reputación dentro de la red comunitaria" />
        </div>
      </app-surface-card>

      @if (errorMessage()) {
        <app-notice tone="danger" title="No pudimos cargar tus solicitudes" [message]="errorMessage()" />
      }

      @if (successMessage()) {
        <app-notice tone="success" title="Solicitud publicada" [message]="successMessage()" />
      }

      @for (warning of hubWarnings(); track warning.title) {
        <app-notice tone="warning" [title]="warning.title" [message]="warning.message" />
      }

      @if (isLoading()) {
        <app-unified-loading-state label="Cargando favores" />
      } @else if (collaborator()) {
        <app-surface-card variant="page" extraClass="grid gap-4 p-5">
          <app-internal-page-section-header
            eyebrow="Tu perfil"
            title="Participa como solicitante o colaborador"
            subtitle="Activa tu disponibilidad cuando quieras recibir solicitudes y mantén tus datos de ruta al día para mejorar el matching."
            [meta]="availabilityStatusLabel(collaborator()!.availabilityStatus)"
          />

          <app-notice
            [tone]="collaborator()!.isAvailable ? 'success' : 'warning'"
            [title]="collaborator()!.isAvailable ? 'Disponibilidad activa' : 'Disponibilidad pausada'"
            [message]="collaborator()!.isAvailable
              ? 'Aparecerás para nuevas coincidencias mientras tu estado se mantenga disponible.'
              : 'Puedes seguir publicando favores, pero no aparecerás como colaborador disponible hasta activarte.'"
          />

          <form class="grid gap-4" [formGroup]="availabilityForm" (ngSubmit)="saveAvailability()">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Disponibilidad general</span>
                <select class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" formControlName="availabilityStatus">
                  <option value="Disconnected">Desconectado</option>
                  <option value="Available">Disponible</option>
                  <option value="Busy">Ocupado</option>
                </select>
              </label>

              <label class="flex min-h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span class="text-sm font-semibold text-slate-700">Mostrarme para coincidencias</span>
                <input class="h-4 w-4" type="checkbox" formControlName="isAvailable" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Latitud actual</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="currentLatitude" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Longitud actual</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="currentLongitude" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Radio de cobertura (km)</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.1" min="1" formControlName="availabilityRadiusKm" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Disponible desde</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="datetime-local" formControlName="availableFromUtc" />
              </label>

              <label class="grid gap-2 sm:col-span-2">
                <span class="text-sm font-semibold text-slate-700">Disponible hasta</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="datetime-local" formControlName="availableUntilUtc" />
              </label>
            </div>

            <app-button type="submit" [disabled]="isSavingAvailability()" block>
              {{ isSavingAvailability() ? 'Guardando disponibilidad...' : 'Guardar disponibilidad' }}
            </app-button>
          </form>
        </app-surface-card>

        <app-surface-card variant="page" extraClass="grid gap-4 p-5">
          <app-internal-page-section-header
            eyebrow="Crear favor"
            title="Nueva solicitud"
            subtitle="Publica un encargo con origen, destino y recompensa. La red verá el favor y podrá postularse."
          />

          <form class="grid gap-4" [formGroup]="requestForm" (ngSubmit)="createRequest()">
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Tipo de favor</span>
                <select class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" formControlName="type">
                  <option value="MarketPurchase">Compra de mercado</option>
                  <option value="Errand">Encargo</option>
                  <option value="ProductPickup">Recojo de productos</option>
                  <option value="PackageDelivery">Entrega de paquetes</option>
                  <option value="CompensatedFavor">Favor compensado</option>
                </select>
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Compensación</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.01" min="0" formControlName="compensationAmount" />
              </label>

              <label class="grid gap-2 sm:col-span-2">
                <span class="text-sm font-semibold text-slate-700">Título</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="title" />
              </label>

              <label class="grid gap-2 sm:col-span-2">
                <span class="text-sm font-semibold text-slate-700">Descripción</span>
                <textarea class="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700" rows="3" formControlName="description"></textarea>
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Origen</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="originLabel" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Destino</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="destinationLabel" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Latitud origen</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="originLatitude" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Longitud origen</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="originLongitude" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Latitud destino</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="destinationLatitude" />
              </label>

              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Longitud destino</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="destinationLongitude" />
              </label>

              <label class="grid gap-2 sm:col-span-2">
                <span class="text-sm font-semibold text-slate-700">Fecha límite</span>
                <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="datetime-local" formControlName="deadlineUtc" />
              </label>
            </div>

            <app-button type="submit" [disabled]="isCreatingRequest()" block>
              {{ isCreatingRequest() ? 'Publicando solicitud...' : 'Publicar solicitud' }}
            </app-button>
          </form>
        </app-surface-card>

        <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Tus trayectos"
              title="Rutas para mejorar el matching"
              subtitle="Define trayectos habituales para recibir mejores coincidencias cuando haya favores compatibles."
            />

            @if (routeEditingId()) {
              <app-notice
                tone="warning"
                title="Editando trayecto"
                message="Estás actualizando una ruta existente. Puedes limpiar el formulario si prefieres crear una nueva."
              />
            }

            <form class="grid gap-4" [formGroup]="routeForm" (ngSubmit)="saveRoute()">
              <div class="grid gap-3 sm:grid-cols-2">
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Origen</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="originLabel" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Destino</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="destinationLabel" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Latitud origen</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="originLatitude" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Longitud origen</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="originLongitude" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Latitud destino</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="destinationLatitude" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Longitud destino</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="destinationLongitude" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Tiempo estimado (min)</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" min="1" formControlName="estimatedMinutes" />
                </label>
                <label class="grid gap-2">
                  <span class="text-sm font-semibold text-slate-700">Desvío permitido (km)</span>
                  <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.1" min="1" formControlName="deviationRadiusKm" />
                </label>
                <label class="flex min-h-11 items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:col-span-2">
                  <span class="text-sm font-semibold text-slate-700">Ruta activa</span>
                  <input class="h-4 w-4" type="checkbox" formControlName="isActive" />
                </label>
              </div>

              <div class="grid gap-3 sm:grid-cols-2">
                <app-button variant="secondary" type="submit" [disabled]="isSavingRoute()" block>
                  {{ isSavingRoute() ? 'Guardando trayecto...' : routeEditingId() ? 'Actualizar trayecto' : 'Guardar trayecto' }}
                </app-button>
                @if (routeEditingId()) {
                  <app-button variant="ghost" type="button" (click)="resetRouteForm()" block>
                    Limpiar edición
                  </app-button>
                }
              </div>
            </form>

            @if (!routes().length) {
              <app-unified-empty-state
                eyebrow="Trayectos"
                title="Aún no tienes rutas guardadas"
                message="Guarda al menos un trayecto para mejorar el matching cuando aparezcan favores compatibles."
              />
            } @else {
              <div class="grid gap-3">
                @for (route of routes(); track route.id) {
                  <button
                    class="grid gap-2 rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-red-200"
                    type="button"
                    (click)="editRoute(route)"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-extrabold text-slate-950">{{ route.originLabel }} → {{ route.destinationLabel }}</p>
                        <p class="mt-1 text-xs text-slate-500">{{ route.estimatedMinutes }} min · Desvío {{ route.deviationRadiusKm }} km</p>
                      </div>
                      <app-status-badge [status]="route.isActive" [label]="route.isActive ? 'Activo' : 'Inactivo'" />
                    </div>
                  </button>
                }
              </div>
            }
          </app-surface-card>

          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Solicitudes"
              title="Favores disponibles y propios"
              subtitle="Revisa tus solicitudes, encuentra favores abiertos y entra al detalle para aplicar o seguir el estado."
              [meta]="filteredRequests().length + ' visibles'"
            />

            <app-action-chip-row>
              <button
                type="button"
                class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition"
                [class]="scopeChipClass('all')"
                (click)="selectedScope.set('all')"
              >
                Todos
              </button>
              <button
                type="button"
                class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition"
                [class]="scopeChipClass('mine')"
                (click)="selectedScope.set('mine')"
              >
                Mis solicitudes
              </button>
              <button
                type="button"
                class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition"
                [class]="scopeChipClass('available')"
                (click)="selectedScope.set('available')"
              >
                Para colaborar
              </button>
              @for (status of availableStatuses(); track status) {
                <button
                  type="button"
                  class="min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition"
                  [class]="statusChipClass(status)"
                  (click)="toggleStatusFilter(status)"
                >
                  {{ requestStatusLabel(status) }}
                </button>
              }
            </app-action-chip-row>

            <div class="flex items-center justify-between gap-3 rounded-[20px] bg-slate-100/90 px-4 py-3 text-sm text-slate-600">
              <p class="min-w-0">{{ requestsSummary() }}</p>
              <app-button variant="ghost" type="button" [disabled]="isLoading()" (click)="loadHub()">Recargar</app-button>
            </div>

            @if (!filteredRequests().length) {
              <app-unified-empty-state
                eyebrow="Sin resultados"
                title="No hay favores para este filtro"
                message="Prueba con otro estado o vuelve a todos para ver nuevas solicitudes disponibles."
              >
                <app-button variant="secondary" type="button" (click)="clearRequestFilters()">Limpiar filtros</app-button>
              </app-unified-empty-state>
            } @else {
              <div class="grid gap-3">
                @for (request of filteredRequests(); track request.id) {
                  <a
                    class="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200"
                    [routerLink]="['/community/requests', request.id]"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {{ requestTypeLabel(request.type) }}
                        </p>
                        <h3 class="mt-1 text-base font-extrabold tracking-tight text-slate-950">{{ request.title }}</h3>
                        <p class="mt-1 text-sm text-slate-500">{{ request.originLabel }} → {{ request.destinationLabel }}</p>
                      </div>
                      <app-status-badge [status]="request.status" [label]="requestStatusLabel(request.status)" />
                    </div>

                    <div class="flex flex-wrap gap-2">
                      @if (request.isMine) {
                        <app-status-badge status="verified" label="Mi solicitud" />
                      }
                      @if (request.isAssignedToMe) {
                        <app-status-badge status="trusted" label="Asignada a mí" />
                      }
                      <app-status-badge status="available" [label]="'Match ' + formatMatchScore(request.matchScore)" />
                    </div>

                    <div class="grid gap-2 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div class="flex items-center justify-between gap-3">
                        <span>Recompensa</span>
                        <strong class="text-slate-950">{{ request.compensationAmount | currency:'PEN':'symbol-narrow':'1.2-2' }}</strong>
                      </div>
                      @if (request.deadlineUtc) {
                        <div class="flex items-center justify-between gap-3">
                          <span>Límite</span>
                          <span class="text-right text-slate-500">{{ request.deadlineUtc | date:'short' }}</span>
                        </div>
                      }
                    </div>

                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm text-slate-500">{{ requestRoleHint(request) }}</p>
                      <span class="text-sm font-semibold text-red-500">Ver detalle</span>
                    </div>
                  </a>
                }
              </div>
            }
          </app-surface-card>
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class CommunityHubPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly communityApi = inject(CommunityApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly collaborator = signal<CommunityCollaboratorResponse | null>(null);
  readonly routes = signal<CommunityRouteResponse[]>([]);
  readonly requests = signal<CommunityRequestListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isSavingAvailability = signal(false);
  readonly isSavingRoute = signal(false);
  readonly isCreatingRequest = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly hubWarnings = signal<HubWarning[]>([]);
  readonly routeEditingId = signal<string | null>(null);
  readonly selectedScope = signal<RequestScope>('all');
  readonly selectedStatus = signal('');
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

  readonly availableStatuses = computed(() => {
    const statuses = new Set(this.requests().map((request) => request.status));
    return ['Published', 'Searching', 'Accepted', 'InProcess', 'Delivered', 'Confirmed', 'Cancelled']
      .filter((status) => statuses.has(status))
      .concat(Array.from(statuses).filter((status) => !['Published', 'Searching', 'Accepted', 'InProcess', 'Delivered', 'Confirmed', 'Cancelled'].includes(status)).sort((a, b) => a.localeCompare(b)));
  });

  readonly filteredRequests = computed(() => {
    const scope = this.selectedScope();
    const status = this.selectedStatus();
    const currentUserId = this.currentUserId();

    return this.requests().filter((request) => {
      if (scope === 'mine' && !request.isMine) {
        return false;
      }

      if (scope === 'available' && (request.isMine || request.isAssignedToMe || request.createdByUserId === currentUserId)) {
        return false;
      }

      if (status && request.status !== status) {
        return false;
      }

      return true;
    });
  });

  readonly completedRequestsCount = computed(
    () => this.requests().filter((request) => ['Delivered', 'Confirmed'].includes(request.status)).length,
  );

  readonly trustSummary = computed(() => {
    const collaborator = this.collaborator();
    if (!collaborator) {
      return '0%';
    }

    return `${Math.round(collaborator.trustScore)}%`;
  });

  readonly availabilitySummary = computed(() => {
    const collaborator = this.collaborator();
    return collaborator ? this.availabilityStatusLabel(collaborator.availabilityStatus) : 'Sin perfil';
  });

  readonly requestsSummary = computed(() => {
    const count = this.filteredRequests().length;

    if (!count) {
      return 'No hay solicitudes para el filtro actual.';
    }

    if (this.selectedScope() === 'mine') {
      return count === 1 ? '1 solicitud tuya visible.' : `${count} solicitudes tuyas visibles.`;
    }

    if (this.selectedScope() === 'available') {
      return count === 1 ? '1 favor disponible para colaborar.' : `${count} favores disponibles para colaborar.`;
    }

    return count === 1 ? '1 solicitud visible en Community.' : `${count} solicitudes visibles en Community.`;
  });

  constructor() {
    this.loadHub();

    effect(() => {
      if (!this.collaborator()?.isAvailable && this.availabilityForm.controls.isAvailable.value) {
        return;
      }
    });
  }

  loadHub(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.hubWarnings.set([]);

    const collaboratorLoad$ = this.wrapLoad(
      this.communityApi.getMyCollaborator(),
      null,
      'No pudimos cargar tu perfil colaborador',
    ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    forkJoin({
      collaborator: collaboratorLoad$,
      routes: collaboratorLoad$.pipe(
        switchMap((collaborator) =>
          collaborator.data
            ? this.wrapLoad(this.communityApi.getMyRoutes(), [], 'No pudimos cargar rutas disponibles')
            : of({ data: [], warning: null } satisfies HubLoadResult<CommunityRouteResponse[]>),
        ),
      ),
      requests: this.wrapLoad(this.communityApi.getRequests(), [], 'No pudimos cargar tus solicitudes'),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ collaborator, routes, requests }) => {
          this.collaborator.set(collaborator.data);
          this.routes.set(routes.data);
          this.requests.set(requests.data);
          this.errorMessage.set(requests.warning?.message ?? '');
          this.hubWarnings.set(
            [collaborator.warning, routes.warning].filter((warning): warning is HubWarning => !!warning),
          );
          if (collaborator.data) {
            this.availabilityForm.patchValue({
              isAvailable: collaborator.data.isAvailable,
              availabilityStatus: collaborator.data.availabilityStatus,
              currentLatitude: collaborator.data.currentLatitude ?? null,
              currentLongitude: collaborator.data.currentLongitude ?? null,
              availabilityRadiusKm: collaborator.data.availabilityRadiusKm,
              availableFromUtc: this.toLocalDateTime(collaborator.data.availableFromUtc),
              availableUntilUtc: this.toLocalDateTime(collaborator.data.availableUntilUtc),
            });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el módulo Community.'));
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
        this.resetRouteForm();
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

  resetRouteForm(): void {
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
  }

  createRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      const message = 'Completa los campos obligatorios del favor antes de publicarlo.';
      this.errorMessage.set(message);
      this.notificationService.warning(message);
      return;
    }

    this.isCreatingRequest.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
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
          this.selectedScope.set('mine');
          this.selectedStatus.set('');
          this.successMessage.set('Tu favor fue publicado correctamente y ya aparece en tu listado.');
          this.notificationService.success('Favor publicado correctamente.');
          this.isCreatingRequest.set(false);
          this.loadHub();
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo publicar la solicitud.'));
          this.notificationService.error(this.errorMessage());
          this.isCreatingRequest.set(false);
        },
      });
  }

  toggleStatusFilter(status: string): void {
    this.selectedStatus.set(this.selectedStatus() === status ? '' : status);
  }

  clearRequestFilters(): void {
    this.selectedScope.set('all');
    this.selectedStatus.set('');
  }

  scopeChipClass(scope: RequestScope): string {
    return this.selectedScope() === scope
      ? 'border-red-200 bg-red-50 text-red-600'
      : 'border-slate-200 bg-white text-slate-600';
  }

  statusChipClass(status: string): string {
    return this.selectedStatus() === status
      ? 'border-slate-900 bg-slate-900 text-white'
      : 'border-slate-200 bg-white text-slate-600';
  }

  requestStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Published: 'Publicado',
      Searching: 'Buscando ayuda',
      Assigned: 'Asignado',
      Accepted: 'Asignado',
      InProgress: 'En proceso',
      InProcess: 'En proceso',
      Delivered: 'Entregado',
      Confirmed: 'Confirmado',
      Cancelled: 'Cancelado',
      Rejected: 'Rechazado',
      Expired: 'Vencido',
    };

    return labels[status] ?? status;
  }

  requestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      MarketPurchase: 'Compra de mercado',
      Errand: 'Encargo',
      ProductPickup: 'Recojo de productos',
      PackageDelivery: 'Entrega de paquetes',
      CompensatedFavor: 'Favor compensado',
    };

    return labels[type] ?? type;
  }

  requestRoleHint(request: CommunityRequestListItemResponse): string {
    if (request.isMine) {
      return 'Eres quien publicó este favor.';
    }

    if (request.isAssignedToMe) {
      return 'Ya estás asignado a esta solicitud.';
    }

    return 'Entra al detalle para aplicar o revisar el estado.';
  }

  availabilityStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Disconnected: 'Desconectado',
      Available: 'Disponible',
      Busy: 'Ocupado',
    };

    return labels[status] ?? status;
  }

  formatMatchScore(score: number): string {
    return `${Math.round(score)}%`;
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

  private wrapLoad<T>(source$: import('rxjs').Observable<T>, fallback: T, title: string) {
    return source$.pipe(
      map((data): HubLoadResult<T> => ({ data, warning: null })),
      catchError((error) =>
        of({
          data: fallback,
          warning: {
            title,
            message: getErrorMessage(error, 'Revisa tu conexión e inténtalo nuevamente.'),
          },
        } satisfies HubLoadResult<T>),
      ),
    );
  }
}

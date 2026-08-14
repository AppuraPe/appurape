import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import {
  CommunityCollaboratorResponse,
  CommunityRequestApplicationResponse,
  CommunityRequestDetailResponse,
  CommunityRequestMatchResponse,
} from '../../core/models/community.models';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { ActionChipRowComponent } from '../../shared/components/action-chip-row.component';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-community-request-detail-page',
  host: {
    class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden',
  },
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    AppBackButtonComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    ActionChipRowComponent,
    BottomSafeActionBarComponent,
  ],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      extraClass="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden px-4 pt-4 sm:px-5 lg:px-0 lg:pt-0"
      bottomSpacingClass="pb-[calc(104px+env(safe-area-inset-bottom,0px))]"
    >
      <app-back-button fallbackUrl="/community" label="Volver a favores" />

      @if (errorMessage()) {
        <app-notice tone="danger" title="No pudimos abrir el favor" [message]="errorMessage()" />
      }

      @if (isLoading()) {
        <app-unified-loading-state label="Cargando favor" />
      } @else if (!request()) {
        <app-unified-empty-state
          eyebrow="Favores"
          title="No encontramos esta solicitud"
          message="Revisa el enlace o vuelve al listado para elegir otro favor disponible."
        >
          <app-button routerLink="/community" variant="secondary">Volver al hub</app-button>
        </app-unified-empty-state>
      } @else if (request(); as currentRequest) {
        <app-surface-card variant="page" extraClass="grid w-full min-w-0 max-w-full gap-4 overflow-hidden p-4 min-[390px]:p-5">
          <app-internal-page-section-header
            eyebrow="Detalle del favor"
            [title]="currentRequest.title"
            [meta]="requestStatusLabel(currentRequest.status)"
          />

          <div class="flex w-full min-w-0 max-w-full flex-wrap gap-2">
            <app-status-badge [status]="currentRequest.status" [label]="requestStatusLabel(currentRequest.status)" />
            <app-status-badge [status]="currentRequest.type" [label]="requestTypeLabel(currentRequest.type)" />
            @if (currentRequest.sourceType === 'AppuraPeOrder') {
              <app-status-badge status="verified" label="Compra AppuraPe" />
            }
            @if (currentRequest.assignedCollaboratorName) {
              <div
                class="flex w-full min-w-0 max-w-full items-center gap-2 rounded-[14px] bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                [title]="'Asignado a ' + currentRequest.assignedCollaboratorName"
              >
                <span class="shrink-0 font-black uppercase tracking-[0.12em]">Asignado</span>
                <span class="min-w-0 flex-1 truncate font-semibold">{{ currentRequest.assignedCollaboratorName }}</span>
              </div>
            }
          </div>

          @if (isOwner() || !canAccept()) {
            <app-notice [tone]="roleNoticeTone()" [title]="roleNoticeTitle()" [message]="roleNoticeMessage()" />
          }

          @if (successMessage()) {
            <app-notice tone="success" title="Acción completada" [message]="successMessage()" />
          }

          @if (showApplicationNotice()) {
            <app-notice
              tone="success"
              title="Tu postulación fue enviada"
              [message]="'Estado actual: ' + applicationStatusLabel(myApplication()!.status) + '.'"
            />
          }

          @if (!isOwner() && !isCollaboratorReady() && canAccept()) {
            <app-notice
              tone="warning"
              title="Activa tu disponibilidad"
              message="Activa tu disponibilidad en Favores para poder postularte a este encargo."
            />
          }

          @if (currentRequest.pickupCode && isAssignedToMe() && !currentRequest.pickupConfirmedAtUtc) {
            <div class="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center">
              <p class="text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">Código para recoger en el negocio</p>
              <p class="mt-1 text-2xl font-black tracking-[0.2em] text-slate-950">{{ currentRequest.pickupCode }}</p>
            </div>
          }

          @if (showOwnerConfirmationHint()) {
            <app-notice
              tone="info"
              title="Comparte este código con tu colaborador"
              [message]="'Entrega este código únicamente después de recibir el favor y pagar el importe mostrado. Código: ' + currentRequest.confirmationCode"
            />
          }

          @if (currentRequest.status === 'Cancelled' && currentRequest.cancellationReason) {
            <app-notice tone="danger" title="Solicitud cancelada" [message]="'Motivo: ' + currentRequest.cancellationReason" />
          }

          @if (currentRequest.status === 'Confirmed' && currentRequest.collaboratorFeedback) {
            <app-notice tone="success" title="Calificación registrada" [message]="currentRequest.collaboratorFeedback" />
          }
        </app-surface-card>

        <app-surface-card variant="page" extraClass="grid gap-3 p-4 min-[390px]:p-5">
          <app-internal-page-section-header
            eyebrow="Resumen"
            title="Datos del favor"
          />

          @if (isOwner() || isAssignedToMe() || !canAccept()) {
          <app-action-chip-row>
            @for (step of timelineSteps(); track step.key) {
              <span
                class="inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-xs font-semibold"
                [class]="step.isCurrent
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : step.isDone
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-400'"
              >
                {{ step.label }}
              </span>
            }
          </app-action-chip-row>
          }

          <div class="grid grid-cols-2 gap-2">
            <div class="min-w-0 rounded-2xl bg-slate-50 px-3 py-3">
              <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Publicado por</p>
              <p class="mt-1 truncate text-sm font-semibold text-slate-950">{{ currentRequest.createdByFullName }}</p>
            </div>

            <div class="min-w-0 rounded-2xl bg-slate-50 px-3 py-3">
              <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Recompensa</p>
              <p class="mt-1 text-sm font-semibold text-slate-950">
                {{ currentRequest.compensationAmount | currency:'PEN':'S/ ':'1.2-2' }}
              </p>
            </div>

            @if (currentRequest.deadlineUtc) {
              <div class="col-span-2 min-w-0 rounded-2xl bg-slate-50 px-3 py-3">
                <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Fecha límite</p>
                <p class="mt-1 text-sm font-semibold text-slate-950">{{ currentRequest.deadlineUtc | date:'short' }}</p>
              </div>
            }

            @if ((isOwner() || isAssignedToMe()) && progressTimestampLabel() !== 'Sin registro') {
              <div class="col-span-2 min-w-0 rounded-2xl bg-slate-50 px-3 py-3">
                <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Último avance</p>
                <p class="mt-1 text-sm font-semibold text-slate-950">{{ progressTimestampLabel() }}</p>
              </div>
            }
          </div>

          <div class="min-w-0 py-1">
            <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Descripción</p>
            <p class="mt-1 break-words text-sm leading-5 text-slate-600">{{ currentRequest.description }}</p>
          </div>

          <div class="grid gap-2 sm:grid-cols-2">
            <div class="min-w-0 rounded-2xl bg-slate-50 p-3">
              <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Origen</p>
              <p class="mt-1 break-words text-sm font-semibold text-slate-950">{{ currentRequest.originLabel }}</p>
            </div>

            <div class="min-w-0 rounded-2xl bg-slate-50 p-3">
              <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Destino</p>
              <p class="mt-1 break-words text-sm font-semibold text-slate-950">{{ currentRequest.destinationLabel }}</p>
            </div>
          </div>
        </app-surface-card>

        @if (showMatches()) {
          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Coincidencias"
              title="Posibles colaboradores"
              subtitle="Estas personas o rutas aparecen como mejores opciones para atender tu solicitud."
              [meta]="matches().length + ' opciones'"
            />

            @if (!matches().length) {
              <app-unified-empty-state
                eyebrow="Sin coincidencias"
                title="Aún no hay ayuda sugerida"
                message="Todavía no encontramos colaboradores adecuados. Vuelve a intentar en unos minutos o comparte mejor el origen y destino."
              />
            } @else {
              <div class="grid gap-3">
                @for (match of matches(); track match.collaboratorId) {
                  <div class="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="text-sm font-extrabold text-slate-950">{{ match.fullName }}</p>
                        <p class="mt-1 text-xs text-slate-500">
                          {{ collaborationLevelLabel(match.collaborationLevel) }} · {{ roundedScore(match.trustScore) }}% de confianza
                        </p>
                      </div>
                      <app-status-badge status="available" [label]="'Match ' + roundedScore(match.matchScore) + '%'" />
                    </div>

                    <div class="grid gap-2 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div class="flex items-center justify-between gap-3">
                        <span>Distancia</span>
                        <strong class="text-slate-950">{{ match.distanceKm | number:'1.1-1' }} km</strong>
                      </div>
                      <div class="flex items-center justify-between gap-3">
                        <span>Tiempo estimado</span>
                        <strong class="text-slate-950">{{ match.estimatedMinutes }} min</strong>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </app-surface-card>
        }

        @if (showApplications()) {
          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Postulaciones"
              title="Personas interesadas"
              subtitle="Revisa quiénes se postularon y selecciona a tu colaborador cuando el flujo lo permita."
              [meta]="currentRequest.applications.length + ' postulaciones'"
            />

            <div class="grid gap-3">
              @for (application of currentRequest.applications; track application.applicationId) {
                <div class="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-extrabold text-slate-950">{{ application.fullName }}</p>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ collaborationLevelLabel(application.collaborationLevel) }} · {{ roundedScore(application.trustScore) }}% de confianza
                      </p>
                    </div>
                    <app-status-badge [status]="application.status" [label]="applicationStatusLabel(application.status)" />
                  </div>

                  <div class="grid gap-2 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div class="flex items-center justify-between gap-3">
                      <span>Distancia</span>
                      <strong class="text-slate-950">{{ application.distanceKm | number:'1.1-1' }} km</strong>
                    </div>
                    <div class="flex items-center justify-between gap-3">
                      <span>Match</span>
                      <strong class="text-slate-950">{{ roundedScore(application.matchScore) }}%</strong>
                    </div>
                  </div>

                  @if (canSelectApplication(application)) {
                    <app-button
                      type="button"
                      variant="secondary"
                      [disabled]="isWorking()"
                      (click)="selectApplication(application.applicationId)"
                      block
                    >
                      {{ isWorking() ? 'Asignando colaborador...' : 'Seleccionar colaborador' }}
                    </app-button>
                  }
                </div>
              }
            </div>
          </app-surface-card>
        }

        @if (canCancel()) {
          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Cancelar"
              title="Cancelar solicitud"
              subtitle="Si ya no necesitas ayuda, registra un motivo para mantener claridad en la red."
            />

            <form [formGroup]="cancelForm" (ngSubmit)="cancelRequest()" class="grid gap-4">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Motivo de cancelación</span>
                <input
                  class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  type="text"
                  formControlName="reason"
                />
              </label>
              <app-button variant="ghost" type="submit" [disabled]="isWorking()" block>
                {{ isWorking() ? 'Procesando cancelación...' : 'Cancelar solicitud' }}
              </app-button>
            </form>
          </app-surface-card>
        }

        @if (canComplete()) {
          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Entrega"
              title="Cerrar con evidencia"
              subtitle="Ingresa el código del cliente y, si lo tienes, adjunta una foto para respaldar la entrega."
            />

            <form class="grid gap-4" [formGroup]="completeForm" (ngSubmit)="completeRequest()">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Código OTP del cliente</span>
                <input
                  class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  type="text"
                  formControlName="confirmationCode"
                />
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Foto de evidencia</span>
                <input
                  class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  type="file"
                  accept="image/*"
                  (change)="onProofSelected($event)"
                />
              </label>
              <app-button type="submit" [disabled]="isWorking()" block>
                {{ isWorking() ? 'Marcando entrega...' : 'Marcar como entregada' }}
              </app-button>
            </form>
          </app-surface-card>
        }

        @if (canRate()) {
          <app-surface-card variant="page" extraClass="grid gap-4 p-5">
            <app-internal-page-section-header
              eyebrow="Calificación"
              title="Valora al colaborador"
              subtitle="Tu comentario ayuda a mejorar futuras coincidencias en Favores."
            />

            <form class="grid gap-4" [formGroup]="ratingForm" (ngSubmit)="rateCollaborator()">
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Calificación</span>
                <select class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" formControlName="rating">
                  <option [value]="5">5</option>
                  <option [value]="4">4</option>
                  <option [value]="3">3</option>
                  <option [value]="2">2</option>
                  <option [value]="1">1</option>
                </select>
              </label>
              <label class="grid gap-2">
                <span class="text-sm font-semibold text-slate-700">Comentario</span>
                <textarea
                  class="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700"
                  rows="3"
                  formControlName="comment"
                ></textarea>
              </label>
              <app-button variant="secondary" type="submit" [disabled]="isWorking()" block>
                {{ isWorking() ? 'Guardando calificación...' : 'Guardar calificación' }}
              </app-button>
            </form>
          </app-surface-card>
        }

        @if (hasPrimaryActionBar()) {
          <app-bottom-safe-action-bar mode="fixed" extraClass="z-[120]">
            <div class="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <div class="min-w-0">
                <p class="text-sm font-extrabold text-slate-950">{{ primaryActionTitle() }}</p>
                <p class="text-xs text-slate-500">{{ primaryActionHint() }}</p>
              </div>
              <button
                type="button"
                class="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-primary-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-primary-700/20 transition-all duration-300 ease-out active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55 disabled:transform-none sm:w-auto"
                [disabled]="isWorking() || primaryActionDisabled()"
                (click)="runPrimaryAction()"
              >
                {{ isWorking() ? 'Procesando...' : primaryActionLabel() }}
              </button>
            </div>
          </app-bottom-safe-action-bar>
        }
      }
    </app-mobile-page-shell>
  `,
})
export class CommunityRequestDetailPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly communityApi = inject(CommunityApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly request = signal<CommunityRequestDetailResponse | null>(null);
  readonly viewerCollaborator = signal<CommunityCollaboratorResponse | null>(null);
  readonly matches = signal<CommunityRequestMatchResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isWorking = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly currentUserId = computed(() => this.authService.currentUser()?.userId ?? null);
  private proofFile: File | null = null;
  private readonly requestId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly completeForm = this.formBuilder.nonNullable.group({
    confirmationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  readonly cancelForm = this.formBuilder.nonNullable.group({
    reason: '',
  });

  readonly ratingForm = this.formBuilder.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: '',
  });

  readonly isOwner = computed(() => this.request()?.createdByUserId === this.currentUserId());
  readonly myApplication = computed(() => {
    const collaboratorId = this.viewerCollaborator()?.id;
    return collaboratorId
      ? this.request()?.applications.find((application) => application.collaboratorId === collaboratorId) ?? null
      : null;
  });
  readonly isCollaboratorReady = computed(() => {
    const collaborator = this.viewerCollaborator();
    return !!collaborator && collaborator.isAvailable && collaborator.availabilityStatus === 'Available';
  });
  readonly isAssignedToMe = computed(() => {
    const request = this.request();
    const collaboratorId = this.viewerCollaborator()?.id;
    return !!request && !!collaboratorId && request.assignedCollaboratorId === collaboratorId;
  });

  readonly showMatches = computed(() => this.isOwner() && ['Published', 'Searching'].includes(this.request()?.status ?? ''));
  readonly showApplicationNotice = computed(() => {
    const request = this.request();
    return !this.isOwner()
      && !!this.myApplication()
      && !!request
      && !request.assignedCollaboratorId
      && ['Published', 'Searching'].includes(request.status);
  });
  readonly showApplications = computed(() => {
    const request = this.request();
    return this.isOwner()
      && !!request
      && (request.applications.length ?? 0) > 0
      && !request.assignedCollaboratorId
      && ['Published', 'Searching'].includes(request.status);
  });
  readonly canAccept = computed(
    () => !this.isOwner() && ['Published', 'Searching'].includes(this.request()?.status ?? '') && !this.myApplication(),
  );
  readonly canStart = computed(() => !this.isOwner() && !this.request()?.orderId && this.request()?.status === 'Accepted');
  readonly canComplete = computed(() => !this.isOwner() && this.request()?.status === 'InProcess');
  readonly canConfirm = computed(() => this.isOwner() && this.request()?.status === 'Delivered' && !this.request()?.clientConfirmedAtUtc);
  readonly canCancel = computed(() => {
    const status = this.request()?.status ?? '';
    return (this.isOwner() || this.isAssignedToMe()) && !['Delivered', 'Cancelled', 'Confirmed'].includes(status);
  });
  readonly canRate = computed(
    () => this.isOwner() && this.request()?.status === 'Confirmed' && !this.request()?.collaboratorRating,
  );

  readonly timelineSteps = computed(() => {
    const status = this.request()?.status ?? '';
    const stepConfig = [
      { key: 'Published', label: 'Publicado' },
      { key: 'Searching', label: 'Buscando ayuda' },
      { key: 'Accepted', label: 'Asignado' },
      { key: 'InProcess', label: 'En proceso' },
      { key: 'Delivered', label: 'Entregado' },
      { key: 'Confirmed', label: 'Confirmado' },
    ];
    const activeIndex = stepConfig.findIndex((step) => step.key === status);

    return stepConfig.map((step, index) => ({
      ...step,
      isDone: activeIndex >= index,
      isCurrent: step.key === status,
    }));
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.communityApi.getRequestById(this.requestId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (request) => {
        this.request.set(request);
        this.completeForm.patchValue({ confirmationCode: '' });
        this.ratingForm.patchValue({
          rating: request.collaboratorRating ?? 5,
          comment: request.collaboratorFeedback ?? '',
        });
        this.isLoading.set(false);
        this.loadViewerCollaborator();
        if (this.showMatches()) {
          this.loadMatches();
        }
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No pudimos cargar este favor. Intenta nuevamente.'));
        this.isLoading.set(false);
      },
    });
  }

  loadMatches(): void {
    this.communityApi.getRequestMatches(this.requestId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (matches) => this.matches.set(matches),
      error: () => this.matches.set([]),
    });
  }

  acceptRequest(): void {
    this.runAction(
      () => this.communityApi.applyToRequest(this.requestId),
      'Tu postulación fue enviada y quedó registrada en la solicitud.',
    );
  }

  selectApplication(applicationId: string): void {
    this.runAction(
      () => this.communityApi.selectApplication(this.requestId, { applicationId }),
      'Colaborador seleccionado correctamente.',
    );
  }

  startRequest(): void {
    this.runAction(() => this.communityApi.startRequest(this.requestId), 'Favor iniciado correctamente.');
  }

  completeRequest(): void {
    if (this.completeForm.invalid) {
      this.completeForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.set('confirmationCode', this.completeForm.controls.confirmationCode.value);
    if (this.proofFile) {
      formData.set('proofImageFile', this.proofFile);
    }

    this.runAction(() => this.communityApi.completeRequest(this.requestId, formData), 'Favor marcado como entregado.');
  }

  confirmRequest(): void {
    this.runAction(() => this.communityApi.confirmRequest(this.requestId), 'Recepción confirmada correctamente.');
  }

  cancelRequest(): void {
    this.runAction(
      () => this.communityApi.cancelRequest(this.requestId, this.cancelForm.getRawValue()),
      'Solicitud cancelada correctamente.',
    );
  }

  rateCollaborator(): void {
    if (this.ratingForm.invalid) {
      this.ratingForm.markAllAsTouched();
      return;
    }

    this.runAction(
      () => this.communityApi.rateCollaborator(this.requestId, this.ratingForm.getRawValue()),
      'Calificación guardada correctamente.',
    );
  }

  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.proofFile = input.files?.item(0) ?? null;
  }

  hasPrimaryActionBar(): boolean {
    return this.canAccept() || this.canStart() || this.canConfirm();
  }

  primaryActionDisabled(): boolean {
    return this.canAccept() && !this.isCollaboratorReady();
  }

  primaryActionLabel(): string {
    if (this.canAccept()) {
      return 'Postularme al favor';
    }

    if (this.canStart()) {
      return 'Iniciar tarea';
    }

    return 'Confirmar recepción';
  }

  primaryActionTitle(): string {
    if (this.canAccept()) {
      return 'Puedes postularte a este favor';
    }

    if (this.canStart()) {
      return 'Ya puedes iniciar la tarea';
    }

    return 'Confirma que recibiste la ayuda';
  }

  primaryActionHint(): string {
    if (this.canAccept()) {
      return 'Tu postulación quedará registrada para que el solicitante elija colaborador.';
    }

    if (this.canStart()) {
      return 'El estado cambiará a en proceso para continuar.';
    }

    return 'Marca la solicitud como confirmada cuando todo esté correcto.';
  }

  runPrimaryAction(): void {
    if (this.primaryActionDisabled()) {
      const message = 'Activa tu disponibilidad en Favores antes de postularte a este encargo.';
      this.errorMessage.set(message);
      this.notificationService.warning(message);
      return;
    }

    if (this.canAccept()) {
      this.acceptRequest();
      return;
    }

    if (this.canStart()) {
      this.startRequest();
      return;
    }

    if (this.canConfirm()) {
      this.confirmRequest();
    }
  }

  requestStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Published: 'Publicado',
      Searching: 'Buscando ayuda',
      Assigned: 'Asignado',
      Accepted: 'Asignado',
      InProcess: 'En proceso',
      InProgress: 'En proceso',
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

  applicationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Selected: 'Seleccionado',
      Rejected: 'Rechazado',
      Accepted: 'Aceptado',
    };

    return labels[status] ?? status;
  }

  collaborationLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      New: 'Nuevo',
      Growing: 'En crecimiento',
      Trusted: 'Confiable',
      Verified: 'Verificado',
      TopCollaborator: 'Top colaborador',
    };

    return labels[level] ?? level;
  }

  roleSummary(): string {
    if (this.isOwner()) {
      return 'Eres quien publicó esta solicitud y puedes seguir el estado, seleccionar colaborador, cancelarla o confirmar la recepción cuando corresponda.';
    }

    return 'Estás viendo este favor como colaborador. Aquí podrás postularte, iniciar o completar la tarea según el estado actual.';
  }

  roleNoticeTitle(): string {
    return this.isOwner() ? 'Vista del solicitante' : 'Vista del colaborador';
  }

  roleNoticeTone(): 'info' | 'success' | 'warning' | 'danger' {
    if (this.request()?.status === 'Cancelled') {
      return 'danger';
    }

    if (this.canAccept() || this.canStart() || this.canConfirm()) {
      return 'success';
    }

    if (this.request()?.status === 'Confirmed') {
      return 'success';
    }

    return 'info';
  }

  roleNoticeMessage(): string {
    const request = this.request();
    if (!request) {
      return '';
    }

    if (this.isOwner()) {
      if (request.assignedCollaboratorName) {
        return `Tu solicitud está siendo atendida por ${request.assignedCollaboratorName}. Revisa el estado y confirma la recepción cuando el favor se entregue.`;
      }

      if (request.applications.length) {
        return 'Tu solicitud ya tiene postulaciones. Revisa las opciones y selecciona a quien mejor pueda ayudarte.';
      }

      if (request.status === 'Confirmed') {
        return request.collaboratorRating
          ? 'El favor ya fue confirmado y calificado. Solo queda revisar el historial.'
          : 'El favor ya fue confirmado. Ahora puedes dejar una calificación para cerrar la experiencia.';
      }

      return 'Tu solicitud sigue abierta. Puedes revisar coincidencias, postulaciones y cancelarla si ya no necesitas ayuda.';
    }

    if (this.canAccept()) {
      return 'Este favor está abierto para colaboración. Puedes postularte y esperar la selección del solicitante.';
    }

    if (this.canStart()) {
      return 'Ya puedes iniciar el favor para indicar que comenzaste a atender la solicitud.';
    }

    if (this.canComplete()) {
      return 'Cuando completes la tarea, usa el código del cliente y adjunta evidencia si la tienes.';
    }

    if (!this.isOwner() && request.orderId && request.status === 'Accepted') {
      return 'Muestra el código de recojo en el negocio. El traslado comenzará cuando validen la entrega del paquete.';
    }

    return 'Revisa la información del favor y espera el siguiente cambio de estado disponible.';
  }

  showOwnerConfirmationHint(): boolean {
    return this.isOwner() && !!this.request()?.confirmationCode && ['Accepted', 'InProcess', 'Delivered'].includes(this.request()?.status ?? '');
  }

  canSelectApplication(application: CommunityRequestApplicationResponse): boolean {
    const request = this.request();
    return !!request
      && this.isOwner()
      && ['Published', 'Searching'].includes(request.status)
      && application.status === 'Pending';
  }

  progressTimestampLabel(): string {
    const request = this.request();
    const value = request?.clientConfirmedAtUtc ?? request?.deliveredAtUtc ?? request?.startedAtUtc ?? request?.acceptedAtUtc;
    return value ? new Date(value).toLocaleString() : 'Sin registro';
  }

  roundedScore(value: number): number {
    return Math.round(value);
  }

  private loadViewerCollaborator(): void {
    this.communityApi.getMyCollaborator().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (collaborator) => this.viewerCollaborator.set(collaborator),
      error: () => this.viewerCollaborator.set(null),
    });
  }

  private runAction(operation: () => Observable<CommunityRequestDetailResponse>, successMessage: string): void {
    this.isWorking.set(true);
    this.successMessage.set('');
    operation().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (request) => {
        this.request.set(request);
        this.errorMessage.set('');
        this.successMessage.set(successMessage);
        this.notificationService.success(successMessage);
        this.isWorking.set(false);
        this.loadViewerCollaborator();
        if (this.showMatches()) {
          this.loadMatches();
        }
      },
      error: (error) => {
        this.errorMessage.set(this.mapActionError(error));
        this.notificationService.error(this.errorMessage());
        this.isWorking.set(false);
      },
    });
  }

  private mapActionError(error: unknown): string {
    const message = getErrorMessage(error, 'No pudimos actualizar este favor. Intenta nuevamente.');
    const knownMessages: Record<string, string> = {
      'Community request is no longer accepting applications.': 'Esta solicitud ya no acepta postulaciones.',
      'Community request is no longer accepting collaborator selection.': 'Esta solicitud ya no permite seleccionar colaborador.',
      'The selected application is no longer active.': 'La postulación seleccionada ya no está disponible.',
      'Community request cannot be started from the current status.': 'Esta solicitud no puede iniciarse desde el estado actual.',
      'Community request cannot be completed from the current status.': 'Solo el colaborador asignado puede completar este favor cuando esté en curso.',
      'Community request must be delivered before confirmation.': 'No puedes confirmar una solicitud que aún no fue entregada.',
      'Community request must be confirmed before rating.': 'Primero confirma la recepción antes de calificar al colaborador.',
      'Community request can no longer be cancelled.': 'Esta solicitud ya no puede cancelarse.',
      'Confirmation code is invalid.': 'El código de confirmación no es válido.',
      'Confirmation code expired. Ask the requester to recreate the task.': 'El código de confirmación venció. Pide al solicitante que genere un nuevo favor.',
      'Only the requester can select a collaborator.': 'Solo el solicitante puede seleccionar un colaborador.',
      'Only the requester can rate the collaborator.': 'Solo el solicitante puede calificar al colaborador.',
      'You cannot confirm this community request.': 'Solo el solicitante puede confirmar la recepción.',
      'This community request is not assigned to you.': 'Solo el colaborador asignado puede avanzar este favor.',
      'You cannot apply to your own community request.': 'No puedes postularte a tu propia solicitud.',
      'Activate your community availability before accepting requests.': 'Activa tu disponibilidad en Favores antes de postularte a este encargo.',
    };

    return knownMessages[message] ?? message;
  }
}

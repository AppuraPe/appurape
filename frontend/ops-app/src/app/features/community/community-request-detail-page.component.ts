import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import {
  CommunityRequestDetailResponse,
  CommunityRequestMatchResponse,
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
  selector: 'app-community-request-detail-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
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
      <app-back-button fallbackUrl="/community" label="Volver al hub" />

      <app-surface-card variant="page">
        <app-page-header
          eyebrow="Comunidad"
          title="Detalle de solicitud"
          subtitle="Sigue el estado, coordina la entrega y deja evidencia de la colaboración."
        />
        <div class="page-actions">
          <app-button variant="ghost" [routerLink]="'/community'">Volver al hub</app-button>
          <app-button variant="secondary" type="button" [disabled]="isLoading()" (click)="reload()">Recargar</app-button>
        </div>

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        } @else if (isLoading()) {
          <div class="message">Cargando solicitud...</div>
        } @else if (request()) {
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <app-metric-card label="Estado" [value]="request()!.status" helper="Estado operativo actual" />
            <app-metric-card label="Compensación" [value]="request()!.compensationAmount | currency:'PEN':'symbol-narrow':'1.2-2'" helper="Monto ofrecido por la tarea" />
            <app-metric-card label="Match" [value]="(request()!.matchScore | number:'1.0-0') + '%'" helper="Prioridad actual del matching" />
            <app-metric-card label="Solicitante" [value]="request()!.createdByFullName" helper="Usuario que abrió la solicitud" />
          </div>

          <app-surface-card variant="soft" extraClass="mt-5 stack">
            <div class="min-w-0">
              <h2 class="mb-1 text-[1.35rem] font-black tracking-[-0.04em] text-loreto-carbon">{{ request()!.title }}</h2>
              <p class="text-sm leading-6 text-text-muted">{{ request()!.description }}</p>
            </div>

            <div class="inline-status">
              <app-status-badge [status]="request()!.status" />
              <app-status-badge [status]="request()!.type" prefix="Tipo" />
              @if (request()!.assignedCollaboratorName) {
                <app-status-badge status="trusted" [label]="request()!.assignedCollaboratorName!" prefix="Asignado" />
              }
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl bg-surface-soft p-4">
                <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-text-muted">Origen</p>
                <p class="mt-2 text-sm text-loreto-carbon">{{ request()!.originLabel }}</p>
              </div>
              <div class="rounded-2xl bg-surface-soft p-4">
                <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-text-muted">Destino</p>
                <p class="mt-2 text-sm text-loreto-carbon">{{ request()!.destinationLabel }}</p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              @if (request()!.deadlineUtc) {
                <div class="rounded-2xl bg-surface-soft p-4">
                  <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-text-muted">Límite</p>
                  <p class="mt-2 text-sm text-loreto-carbon">{{ request()!.deadlineUtc | date:'medium' }}</p>
                </div>
              }
              @if (request()!.cancellationReason) {
                <div class="rounded-2xl bg-surface-soft p-4">
                  <p class="text-[0.64rem] font-black uppercase tracking-[0.12em] text-text-muted">Cancelación</p>
                  <p class="mt-2 text-sm text-loreto-carbon">{{ request()!.cancellationReason }}</p>
                </div>
              }
            </div>

            @if (request()!.confirmationCode) {
              <app-notice tone="info" title="Código OTP" [message]="'Comparte este código al momento de la entrega: ' + request()!.confirmationCode" />
            }
            @if (request()!.proofImageUrl) {
              <p><a class="text-link" [href]="request()!.proofImageUrl" target="_blank" rel="noreferrer">Abrir evidencia</a></p>
            }
          </app-surface-card>

          @if (showMatches()) {
            <div class="stack mt-5">
              <div class="min-w-0">
                <h2 class="mb-1 text-[1.35rem] font-black tracking-[-0.04em] text-loreto-carbon">Mejores coincidencias</h2>
                <p class="text-sm leading-5.5 text-text-muted">Priorizadas por ruta, cercanía y reputación.</p>
              </div>
              @if (!matches().length) {
                <div class="message">Aún no hay coincidencias útiles para esta solicitud.</div>
              } @else {
                <div class="grid gap-3">
                  @for (match of matches(); track match.collaboratorId) {
                    <div class="list-card">
                      <strong>{{ match.fullName }}</strong>
                      <span class="muted">{{ match.collaborationLevel }} · {{ match.trustScore }}% · {{ match.collaborationRating | number:'1.1-1' }}/5</span>
                      <span class="muted">{{ match.distanceKm | number:'1.1-1' }} km · {{ match.estimatedMinutes }} min · Match {{ match.matchScore | number:'1.0-0' }}%</span>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <div class="mt-5 grid gap-4 lg:grid-cols-2">
            @if (canAccept()) {
              <app-button type="button" [disabled]="isWorking()" (click)="acceptRequest()">
                {{ isWorking() ? 'Procesando...' : 'Aceptar solicitud' }}
              </app-button>
            }
            @if (canStart()) {
              <app-button type="button" [disabled]="isWorking()" (click)="startRequest()">
                {{ isWorking() ? 'Procesando...' : 'Iniciar tarea' }}
              </app-button>
            }
            @if (canConfirm()) {
              <app-button variant="secondary" type="button" [disabled]="isWorking()" (click)="confirmRequest()">
                {{ isWorking() ? 'Procesando...' : 'Confirmar entrega' }}
              </app-button>
            }
            @if (canCancel()) {
              <app-surface-card variant="soft">
                <form [formGroup]="cancelForm" (ngSubmit)="cancelRequest()" class="grid gap-4">
                  <div class="min-w-0">
                    <h2 class="mb-1 text-[1.2rem] font-black tracking-[-0.04em] text-loreto-carbon">Cancelar</h2>
                    <p class="text-sm leading-5.5 text-text-muted">Deja el motivo para mantener claridad en la red.</p>
                  </div>
                  <label><span>Motivo de cancelación</span><input type="text" formControlName="reason" /></label>
                  <app-button variant="ghost" type="submit" [disabled]="isWorking()" block>
                    {{ isWorking() ? 'Procesando...' : 'Cancelar solicitud' }}
                  </app-button>
                </form>
              </app-surface-card>
            }
          </div>

          @if (canComplete()) {
            <app-surface-card variant="soft" extraClass="mt-5">
              <form class="grid gap-4" [formGroup]="completeForm" (ngSubmit)="completeRequest()">
                <div class="min-w-0">
                  <h2 class="mb-1 text-[1.2rem] font-black tracking-[-0.04em] text-loreto-carbon">Cerrar con evidencia</h2>
                  <p class="text-sm leading-5.5 text-text-muted">Ingresa el OTP y adjunta una foto si la tienes disponible.</p>
                </div>
                <label><span>Código OTP del cliente</span><input type="text" formControlName="confirmationCode" /></label>
                <label><span>Foto de evidencia</span><input type="file" accept="image/*" (change)="onProofSelected($event)" /></label>
                <app-button type="submit" [disabled]="isWorking()" block>
                  {{ isWorking() ? 'Procesando...' : 'Marcar como entregada' }}
                </app-button>
              </form>
            </app-surface-card>
          }

          @if (canRate()) {
            <app-surface-card variant="soft" extraClass="mt-5">
              <form class="grid gap-4" [formGroup]="ratingForm" (ngSubmit)="rateCollaborator()">
                <div class="min-w-0">
                  <h2 class="mb-1 text-[1.2rem] font-black tracking-[-0.04em] text-loreto-carbon">Calificar colaborador</h2>
                  <p class="text-sm leading-5.5 text-text-muted">Tu feedback ayuda a mejorar el matching futuro.</p>
                </div>
                <label>
                  <span>Calificación</span>
                  <select formControlName="rating">
                    <option [value]="5">5</option>
                    <option [value]="4">4</option>
                    <option [value]="3">3</option>
                    <option [value]="2">2</option>
                    <option [value]="1">1</option>
                  </select>
                </label>
                <label><span>Comentario</span><textarea rows="3" formControlName="comment"></textarea></label>
                <app-button variant="secondary" type="submit" [disabled]="isWorking()" block>
                  {{ isWorking() ? 'Procesando...' : 'Guardar calificación' }}
                </app-button>
              </form>
            </app-surface-card>
          }
        }
      </app-surface-card>
    </section>
  `,
})
export class CommunityRequestDetailPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly communityApi = inject(CommunityApiService);
  private readonly authService = inject(AuthService);

  readonly request = signal<CommunityRequestDetailResponse | null>(null);
  readonly matches = signal<CommunityRequestMatchResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isWorking = signal(false);
  readonly errorMessage = signal('');
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
  readonly isAssignedToMe = computed(() => !!this.request()?.assignedCollaboratorId && this.request()?.assignedCollaboratorId !== null && this.request()?.assignedCollaboratorName !== null && this.request()?.createdByUserId !== this.currentUserId());

  constructor() {
    this.reload();
  }

  readonly showMatches = computed(() => this.isOwner() && (this.request()?.status === 'Published' || this.request()?.status === 'Searching'));
  readonly canAccept = computed(() => !this.isOwner() && (this.request()?.status === 'Published' || this.request()?.status === 'Searching'));
  readonly canStart = computed(() => this.request()?.status === 'Accepted' && !this.isOwner());
  readonly canComplete = computed(() => (this.request()?.status === 'Accepted' || this.request()?.status === 'InProcess') && !this.isOwner());
  readonly canConfirm = computed(() => this.isOwner() && this.request()?.status === 'Delivered' && !this.request()?.clientConfirmedAtUtc);
  readonly canCancel = computed(() => this.request()?.status !== 'Delivered' && this.request()?.status !== 'Cancelled');
  readonly canRate = computed(() => this.isOwner() && this.request()?.status === 'Delivered');

  reload(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.communityApi.getRequestById(this.requestId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (request) => {
        this.request.set(request);
        this.completeForm.patchValue({ confirmationCode: '' });
        this.ratingForm.patchValue({
          rating: request.collaboratorRating ?? 5,
          comment: request.collaboratorFeedback ?? '',
        });
        this.isLoading.set(false);
        if (this.showMatches()) {
          this.loadMatches();
        }
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar la solicitud comunitaria.'));
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
    this.runAction(() => this.communityApi.acceptRequest(this.requestId));
  }

  startRequest(): void {
    this.runAction(() => this.communityApi.startRequest(this.requestId));
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

    this.runAction(() => this.communityApi.completeRequest(this.requestId, formData));
  }

  confirmRequest(): void {
    this.runAction(() => this.communityApi.confirmRequest(this.requestId));
  }

  cancelRequest(): void {
    this.runAction(() => this.communityApi.cancelRequest(this.requestId, this.cancelForm.getRawValue()));
  }

  rateCollaborator(): void {
    if (this.ratingForm.invalid) {
      this.ratingForm.markAllAsTouched();
      return;
    }

    this.runAction(() => this.communityApi.rateCollaborator(this.requestId, this.ratingForm.getRawValue()));
  }

  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.proofFile = input.files?.item(0) ?? null;
  }

  private runAction(operation: () => any): void {
    this.isWorking.set(true);
    operation().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (request: CommunityRequestDetailResponse) => {
        this.request.set(request);
        this.isWorking.set(false);
        if (this.showMatches()) {
          this.loadMatches();
        }
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudo actualizar la solicitud comunitaria.'));
        this.isWorking.set(false);
      },
    });
  }
}

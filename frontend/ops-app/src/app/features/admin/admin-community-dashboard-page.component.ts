import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CommunityApiService } from '../../core/services/community-api.service';
import {
  CommunityAdminOverviewResponse,
  CommunityCollaboratorResponse,
  CommunityRequestListItemResponse,
} from '../../core/models/community.models';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppMetricCardComponent } from '../../shared/components/app-metric-card.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { PageHeaderComponent } from '../../shared/components/page-header.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';

@Component({
  selector: 'app-admin-community-dashboard-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
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
          eyebrow="Admin"
          title="Favores y confianza"
          subtitle="Monitorea colaboradores, solicitudes comunitarias y la salud distribuida de la red."
        />

        <div class="page-actions">
          <app-button variant="ghost" [routerLink]="'/admin/dashboard'">Volver al inicio</app-button>
          <app-button variant="secondary" type="button" [disabled]="isLoading()" (click)="loadCommunity()">Recargar</app-button>
        </div>

        @if (errorMessage()) {
          <div class="message error">{{ errorMessage() }}</div>
        } @else if (isLoading()) {
          <div class="message">Cargando modulo comunitario...</div>
        } @else if (overview()) {
          <div class="stats-grid">
            <app-metric-card label="Colaboradores activos" [value]="overview()!.activeCollaboratorsCount.toString()" helper="Cuentas participando en la red" />
            <app-metric-card label="Disponibles" [value]="overview()!.availableCollaboratorsCount.toString()" helper="Listos para recibir matching" />
            <app-metric-card label="Solicitudes abiertas" [value]="overview()!.publishedRequestsCount.toString()" helper="Pendientes de asignación o ayuda" />
            <app-metric-card label="Éxito" [value]="overview()!.successRate + '%'" helper="Tareas cerradas correctamente" />
          </div>

          <app-notice
            tone="info"
            title="Pulso de la comunidad"
            [message]="'Promedio de confianza: ' + overview()!.averageTrustScore + '%. Solicitudes entregadas: ' + overview()!.deliveredRequestsCount + '.'"
          />
        }
      </app-surface-card>

      <div class="grid gap-5 lg:grid-cols-2">
        <app-surface-card variant="page" extraClass="stack">
          <div class="section-heading">
            <h2>Top colaboradores</h2>
            <span class="muted">Priorizados por score y colaboraciones completadas.</span>
          </div>
          @for (collaborator of collaborators(); track collaborator.id) {
            <div class="list-card">
              <strong>{{ collaborator.fullName }}</strong>
              <span class="muted">{{ collaborator.collaborationLevel }} · {{ collaborator.trustScore }}% · {{ collaborator.collaborationRating | number:'1.1-1' }}/5</span>
              <div class="inline-status">
                <app-status-badge [status]="collaborator.availabilityStatus" />
                <app-status-badge [status]="collaborator.userStatus" prefix="Cuenta" />
              </div>
            </div>
          }
        </app-surface-card>

        <app-surface-card variant="page" extraClass="stack">
          <div class="section-heading">
            <h2>Solicitudes recientes</h2>
            <span class="muted">Historial rápido de incidencias y operación comunitaria.</span>
          </div>
          @for (request of requests(); track request.id) {
            <div class="list-card">
              <strong>{{ request.title }}</strong>
              <span class="muted">{{ request.type }} · {{ request.originLabel }} -> {{ request.destinationLabel }}</span>
              <span class="muted">{{ request.compensationAmount | currency:'PEN':'S/ ':'1.2-2' }} · Match {{ request.matchScore | number:'1.0-0' }}%</span>
              <app-status-badge [status]="request.status" />
            </div>
          }
        </app-surface-card>
      </div>
    </section>
  `,
})
export class AdminCommunityDashboardPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly communityApi = inject(CommunityApiService);

  readonly overview = signal<CommunityAdminOverviewResponse | null>(null);
  readonly collaborators = signal<CommunityCollaboratorResponse[]>([]);
  readonly requests = signal<CommunityRequestListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.loadCommunity();
  }

  loadCommunity(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      overview: this.communityApi.getAdminOverview(),
      collaborators: this.communityApi.getAdminCollaborators(),
      requests: this.communityApi.getAdminRequests(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ overview, collaborators, requests }) => {
          this.overview.set(overview);
          this.collaborators.set(collaborators.slice(0, 6));
          this.requests.set(requests.slice(0, 8));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getErrorMessage(error, 'No se pudo cargar el panel comunitario.'));
          this.isLoading.set(false);
        },
      });
  }
}

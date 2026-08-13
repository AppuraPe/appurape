import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BadgeCheck, LucideAngularModule, ShieldAlert, UserCheck, XCircle } from 'lucide-angular';
import { CollaboratorVerification } from '../../core/models/admin-finance.models';
import { AdminFinanceApiService } from '../../core/services/admin-finance-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-admin-collaborator-verifications-page',
  host: { class: 'block w-full min-w-0 max-w-full box-border overflow-x-hidden' },
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    LucideAngularModule,
    AppButtonComponent,
    AppNoticeComponent,
    AppSurfaceCardComponent,
    InternalPageSectionHeaderComponent,
    MobilePageShellComponent,
    StatusBadgeComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
  ],
  template: `
    <app-mobile-page-shell [bottomSpacingClass]="'pb-0'" [desktopClass]="'xl:mx-0 xl:max-w-none xl:bg-transparent xl:px-0 xl:pb-0 xl:pt-0'" [extraClass]="'grid w-full min-w-0 max-w-full gap-5 overflow-x-hidden lg:gap-6'">
      <app-surface-card variant="page" extraClass="p-5">
        <app-internal-page-section-header
          eyebrow="Admin"
          title="Verificaciones"
          subtitle="Revisa solicitudes de colaboradores antes de permitir operaciones sensibles."
          [meta]="verifications().length + ' pendientes'"
        />

        @if (errorMessage()) {
          <app-notice class="mt-4" tone="danger" [message]="errorMessage()" />
        }

        <app-notice
          class="mt-4"
          tone="warning"
          title="Revision manual"
          message="La verificacion cuesta S/ 5.00 y no reemplaza una evaluacion real de identidad."
        />
      </app-surface-card>

      @if (isLoading()) {
        <app-unified-loading-state label="Cargando verificaciones" />
      } @else if (!verifications().length) {
        <app-unified-empty-state title="Sin solicitudes pendientes" message="Cuando un colaborador solicite verificacion aparecera aqui.">
          <app-button type="button" variant="secondary" (click)="load()">Recargar</app-button>
        </app-unified-empty-state>
      } @else {
        <div class="grid gap-4">
          @for (verification of verifications(); track verification.id) {
            <app-surface-card variant="page" extraClass="p-4 sm:p-5">
              <div class="flex items-start gap-4">
                <div class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-700 text-white shadow-lg shadow-primary-700/20">
                  <lucide-angular class="h-6 w-6" [img]="shieldIcon" aria-hidden="true"></lucide-angular>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p class="text-xs font-black uppercase tracking-[0.14em] text-primary-700">Colaborador</p>
                      <h3 class="mt-1 text-lg font-black tracking-[-0.03em] text-slate-950">{{ verification.userFullName || 'Usuario AppuraPe' }}</h3>
                    </div>
                    <app-status-badge [status]="verification.status" [label]="verificationStatusLabel(verification.status)" />
                  </div>

                  <div class="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 min-[390px]:grid-cols-2">
                    <span>Costo: <strong class="text-slate-900">{{ verification.verificationFeeAmount | currency: 'PEN' : 'S/ ' : '1.2-2' }}</strong></span>
                    <span>Solicitud: <strong class="text-slate-900">{{ verification.submittedAtUtc | date: 'short' }}</strong></span>
                  </div>

                  <div class="mt-4 grid gap-3 md:grid-cols-3">
                    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <p class="p-2 text-xs font-bold text-slate-600">Foto de perfil</p>
                      @if (verification.profilePhotoUrl) { <img class="h-44 w-full object-cover" [src]="verification.profilePhotoUrl" alt="Foto de perfil" /> }
                    </div>
                    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div class="flex items-center justify-between p-2"><p class="text-xs font-bold text-slate-600">DNI privado</p><button class="text-xs font-bold text-primary-700" type="button" (click)="loadEvidence(verification.id, 'dni')">Ver</button></div>
                      @if (evidenceUrl(verification.id, 'dni')) { <img class="h-44 w-full object-contain" [src]="evidenceUrl(verification.id, 'dni')" alt="Documento de identidad" /> }
                    </div>
                    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div class="flex items-center justify-between p-2"><p class="text-xs font-bold text-slate-600">Selfie en vivo</p><button class="text-xs font-bold text-primary-700" type="button" (click)="loadEvidence(verification.id, 'selfie')">Ver</button></div>
                      @if (evidenceUrl(verification.id, 'selfie')) { <img class="h-44 w-full object-cover" [src]="evidenceUrl(verification.id, 'selfie')" alt="Selfie en vivo" /> }
                      @if (verification.liveSelfieCapturedAtUtc) { <p class="p-2 text-[11px] text-slate-500">Capturada {{ verification.liveSelfieCapturedAtUtc | date:'short' }}</p> }
                    </div>
                  </div>

                  <div class="mt-4 flex flex-wrap justify-end gap-2">
                    <app-button type="button" variant="success" size="sm" [loading]="processingId() === verification.id" (click)="approve(verification)">
                      <lucide-angular class="h-4 w-4" [img]="approveIcon" aria-hidden="true"></lucide-angular>
                      Aprobar
                    </app-button>
                    <app-button type="button" variant="danger" size="sm" [loading]="processingId() === verification.id" (click)="reject(verification)">
                      <lucide-angular class="h-4 w-4" [img]="rejectIcon" aria-hidden="true"></lucide-angular>
                      Rechazar
                    </app-button>
                  </div>
                </div>
              </div>
            </app-surface-card>
          }
        </div>
      }
    </app-mobile-page-shell>
  `,
})
export class AdminCollaboratorVerificationsPageComponent {
  private readonly financeApi = inject(AdminFinanceApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly shieldIcon = ShieldAlert;
  readonly approveIcon = UserCheck;
  readonly rejectIcon = XCircle;
  readonly verifiedIcon = BadgeCheck;

  readonly verifications = signal<CollaboratorVerification[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly processingId = signal('');
  readonly evidenceUrls = signal<Record<string, string>>({});

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.financeApi.getPendingCollaboratorVerifications().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (verifications) => {
        this.verifications.set(verifications);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getErrorMessage(error, 'No se pudieron cargar las verificaciones.'));
        this.isLoading.set(false);
      },
    });
  }

  approve(verification: CollaboratorVerification): void {
    if (!confirm('¿Aprobar esta verificacion de colaborador?')) {
      return;
    }

    this.processingId.set(verification.id);
    this.financeApi.approveCollaboratorVerification(verification.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.processingId.set('');
        this.notificationService.success('Colaborador verificado.');
        this.load();
      },
      error: (error) => {
        this.processingId.set('');
        this.notificationService.error(getErrorMessage(error, 'No se pudo aprobar la verificacion.'));
      },
    });
  }

  reject(verification: CollaboratorVerification): void {
    const reason = prompt('Motivo de rechazo');
    if (!reason?.trim()) {
      return;
    }

    this.processingId.set(verification.id);
    this.financeApi.rejectCollaboratorVerification(verification.id, { reason: reason.trim() }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.processingId.set('');
        this.notificationService.success('Verificacion rechazada.');
        this.load();
      },
      error: (error) => {
        this.processingId.set('');
        this.notificationService.error(getErrorMessage(error, 'No se pudo rechazar la verificacion.'));
      },
    });
  }

  evidenceUrl(id: string, type: 'dni' | 'selfie'): string {
    return this.evidenceUrls()[`${id}:${type}`] ?? '';
  }

  loadEvidence(id: string, type: 'dni' | 'selfie'): void {
    if (this.evidenceUrl(id, type)) return;
    this.financeApi.getCollaboratorEvidence(id, type).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => this.evidenceUrls.update((urls) => ({ ...urls, [`${id}:${type}`]: URL.createObjectURL(blob) })),
      error: (error) => this.notificationService.error(getErrorMessage(error, 'No se pudo abrir la evidencia privada.')),
    });
  }

  verificationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      NotVerified: 'No verificado',
      PendingVerification: 'Pendiente de verificación',
      Verified: 'Verificado',
      Rejected: 'Rechazado',
      Suspended: 'Suspendido',
      Expired: 'Verificacion vencida',
    };

    return labels[status] ?? status;
  }
}

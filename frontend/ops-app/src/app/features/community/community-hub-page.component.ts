import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CommunityApiService } from '../../core/services/community-api.service';
import {
  CommunityCollaboratorResponse,
  CommunityRequestListItemResponse,
  CommunityRouteResponse,
} from '../../core/models/community.models';
import { NotificationService } from '../../core/services/notification.service';
import { LegalApiService } from '../../core/services/legal-api.service';
import { LegalDocument } from '../../core/models/legal.models';
import { getErrorMessage } from '../../core/utils/http-error.utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';
import { LocationMapPickerModalComponent } from '../../shared/components/location-map-picker-modal.component';
import { LucideAngularModule, MapPin, Navigation, Sparkles, Store, ShieldCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-angular';

export type CommunityMode =
  | 'customer'
  | 'collaborator'
  | 'driver'
  | 'business-blocked'
  | 'admin-redirect';

type CustomerScope = 'active' | 'completed' | 'cancelled';
type CollaboratorScope = 'available' | 'taken' | 'history';

@Component({
  selector: 'app-community-hub-page',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AppBackButtonComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    AppButtonComponent,
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    LocationMapPickerModalComponent,
  ],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      extraClass="space-y-4 px-4 pt-4 sm:px-5 lg:px-0 lg:pt-0"
      bottomSpacingClass="pb-6"
    >
      <app-back-button [fallbackUrl]="defaultBackUrl()" label="Volver" />

      <!-- MODO: NEGOCIO BLOQUEADO -->
      @if (communityMode() === 'business-blocked') {
        <app-surface-card variant="hero" extraClass="p-5 sm:p-6 text-center space-y-4">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
            <i-lucide [img]="storeIcon" class="h-7 w-7"></i-lucide>
          </div>
          <div class="space-y-1.5">
            <h1 class="text-xl font-black tracking-tight text-slate-900">Favores no disponible en modo negocio</h1>
            <p class="text-xs text-slate-600 sm:text-sm max-w-md mx-auto">
              Esta sección es exclusiva para solicitar encargos personales o realizar favores comunitarios. Cambia a modo Cliente con esta misma cuenta.
            </p>
          </div>
          <div class="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <app-button variant="primary" (click)="switchToCustomer()">
              Usar como Cliente
            </app-button>
            <app-button variant="secondary" routerLink="/business/dashboard">
              Volver al negocio
            </app-button>
          </div>
        </app-surface-card>
      }

      <!-- MODO: ADMIN REDIRECT -->
      @else if (communityMode() === 'admin-redirect') {
        <app-surface-card variant="hero" extraClass="p-5 sm:p-6 text-center space-y-4">
          <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-800 shadow-xs">
            <i-lucide [img]="shieldIcon" class="h-7 w-7"></i-lucide>
          </div>
          <div class="space-y-1.5">
            <h1 class="text-xl font-black tracking-tight text-slate-900">Administración de Favores</h1>
            <p class="text-xs text-slate-600 sm:text-sm max-w-md mx-auto">
              Como administrador, gestiona los favores y las verificaciones desde el panel de control.
            </p>
          </div>
          <div class="pt-2">
            <app-button variant="primary" routerLink="/admin/dashboard">
              Ir al panel de administración
            </app-button>
          </div>
        </app-surface-card>
      }

      <!-- MODO: DRIVER SIN PERFIL COLABORADOR -->
      @else if (communityMode() === 'driver') {
        <section class="grid min-w-0 gap-3 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
          <app-internal-page-section-header
            eyebrow="Favores"
            title="Colaboración comunitaria"
            subtitle="Para tomar encargos comunitarios, activa y valida tu perfil de colaborador."
          />
          @if (isApprovedCollaborator()) {
            <app-notice
              tone="success"
              title="Perfil de colaborador aprobado"
              message="Ya estás verificado como colaborador. Cambia a modo Colaborador para tomar favores disponibles."
            />
            <div class="pt-2">
              <app-button variant="primary" (click)="switchToCollaborator()">
                Cambiar a modo Colaborador
              </app-button>
            </div>
          } @else {
            <app-notice
              tone="info"
              title="Activación requerida"
              message="Los conductores verificados pueden activar su perfil de colaborador para generar ingresos adicionales con favores."
            />
            <div class="pt-2">
              <app-button variant="primary" (click)="switchToCustomer()">
                Ir a modo Cliente para solicitar verificación
              </app-button>
            </div>
          }
        </section>
      }

      <!-- MODO: CLIENTE / COLABORADOR -->
      @else {
        <!-- HEADER PRINCIPAL -->
        <section class="grid min-w-0 gap-3 rounded-[20px] border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-4">
          <app-internal-page-section-header
            eyebrow="Favores"
            [title]="pageTitle()"
            [subtitle]="pageSubtitle()"
          />
        </section>

        @if (errorMessage()) {
          <app-notice tone="danger" title="Aviso" [message]="errorMessage()" />
        }

        @if (successMessage()) {
          <app-notice tone="success" title="Completado" [message]="successMessage()" />
        }

        @if (isLoading()) {
          <app-unified-loading-state label="Cargando favores" />
        } @else {
          <!-- EXPERIENCIA CUSTOMER: MIS FAVORES -->
          @if (communityMode() === 'customer') {
            <!-- ACCIÓN 1: PUBLICAR UN FAVOR -->
            <details class="group min-w-0 overflow-hidden rounded-[20px] border border-orange-200/70 bg-gradient-to-r from-orange-50/50 via-white to-amber-50/30 shadow-sm">
              <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
                <span class="min-w-0">
                  <strong class="block text-sm font-bold text-slate-950">¿Necesitas ayuda? Solicita un favor</strong>
                  <span class="block truncate text-xs text-slate-500">Publica un encargo o compra rápida para recibir apoyo</span>
                </span>
                <span class="shrink-0 rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white group-open:hidden">Solicitar</span>
                <span class="hidden shrink-0 text-xs font-semibold text-slate-500 group-open:inline">Cerrar</span>
              </summary>
              <div class="grid gap-4 border-t border-orange-100 bg-white p-4 sm:p-5">
                <app-internal-page-section-header
                  eyebrow="Crear favor"
                  title="Nueva solicitud de ayuda"
                  subtitle="Publica tu encargo indicando origen, destino y recompensa."
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

                    <label class="grid min-w-0 gap-2">
                      <span class="text-sm font-semibold text-slate-700">Pago al colaborador</span>
                      <div class="relative min-w-0">
                        <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-bold text-slate-500">S/</span>
                        <input class="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700" type="number" step="0.01" min="0" formControlName="compensationAmount" />
                      </div>
                      <small class="text-xs leading-5 text-slate-500">Recompensa ofrecida a quien te ayude.</small>
                    </label>

                    <label class="grid gap-2 sm:col-span-2">
                      <span class="text-sm font-semibold text-slate-700">Título</span>
                      <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="title" placeholder="Ej. Comprar medicina en farmacia" />
                    </label>

                    <label class="grid gap-2 sm:col-span-2">
                      <span class="text-sm font-semibold text-slate-700">Descripción</span>
                      <textarea class="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700" rows="3" formControlName="description" placeholder="Detalles de lo que necesitas..."></textarea>
                    </label>

                    <div class="grid gap-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold text-slate-700">Origen (Recojo / Compra)</span>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            (click)="openMapPicker('origin')"
                            class="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline active:scale-95 transition"
                          >
                            <i-lucide [img]="mapPinIcon" class="h-3.5 w-3.5"></i-lucide>
                            Mapa
                          </button>
                          <span class="text-slate-300">|</span>
                          <button
                            type="button"
                            (click)="detectLocation('origin')"
                            [disabled]="isDetectingLocation()"
                            class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline active:scale-95 transition"
                          >
                            {{ isDetectingLocation() ? 'Detectando...' : 'Mi GPS' }}
                          </button>
                        </div>
                      </div>
                      <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="originLabel" placeholder="Ej. Mercado Modelo de Belén" />
                    </div>

                    <div class="grid gap-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-semibold text-slate-700">Destino (Entrega)</span>
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            (click)="openMapPicker('destination')"
                            class="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:underline active:scale-95 transition"
                          >
                            <i-lucide [img]="mapPinIcon" class="h-3.5 w-3.5"></i-lucide>
                            Mapa
                          </button>
                          <span class="text-slate-300">|</span>
                          <button
                            type="button"
                            (click)="detectLocation('destination')"
                            [disabled]="isDetectingLocation()"
                            class="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:underline active:scale-95 transition"
                          >
                            {{ isDetectingLocation() ? 'Detectando...' : 'Mi GPS' }}
                          </button>
                        </div>
                      </div>
                      <input class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="text" formControlName="destinationLabel" placeholder="Ej. Calle Putumayo 450" />
                    </div>

                    <label class="grid gap-2 sm:col-span-2">
                      <span class="text-sm font-semibold text-slate-700">Fecha límite</span>
                      <input
                        class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                        type="datetime-local"
                        formControlName="deadlineUtc"
                        [min]="deadlineMinimum()"
                        [max]="deadlineMaximum()"
                      />
                      <small class="text-xs leading-5 text-slate-500">Válido hasta por 24 horas.</small>
                    </label>
                  </div>

                  <app-button type="submit" [disabled]="isCreatingRequest()" block>
                    {{ isCreatingRequest() ? 'Publicando solicitud...' : 'Publicar solicitud' }}
                  </app-button>
                </form>
              </div>
            </details>

            <!-- ACCIÓN 2: CARD HACER FAVORES (VERIFICACIÓN / ACTIVACIÓN) -->
            <app-surface-card variant="default" extraClass="p-4 sm:p-5 border border-slate-200/90 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700">
                    <i-lucide [img]="sparklesIcon" class="h-4.5 w-4.5"></i-lucide>
                  </div>
                  <div>
                    <h3 class="text-sm font-bold text-slate-900">¿Quieres hacer favores?</h3>
                    <p class="text-xs text-slate-500">Gana realizando encargos y ayudando en tu zona.</p>
                  </div>
                </div>
                <span
                  class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  [class]="verificationBadgeClass()"
                >
                  {{ verificationStatusLabel() }}
                </span>
              </div>

              @if (verificationStatus() === 'Verified' || isApprovedCollaborator()) {
                <div class="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center justify-between gap-2">
                  <span>¡Tu perfil de colaborador está aprobado!</span>
                  <button
                    type="button"
                    (click)="switchToCollaborator()"
                    class="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-600 transition"
                  >
                    Ir a modo Colaborador
                  </button>
                </div>
              } @else if (verificationStatus() === 'PendingVerification') {
                <div class="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  Estamos revisando tu información de identidad. Te avisaremos cuando se apruebe.
                </div>
              } @else {
                <details class="group rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                  <summary class="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-primary-700 marker:content-none">
                    <span>Solicitar verificación de colaborador</span>
                    <span class="group-open:hidden">Abrir formulario</span>
                    <span class="hidden group-open:inline">Ocultar</span>
                  </summary>
                  <form class="grid gap-3 pt-3" (ngSubmit)="submitCollaboratorVerification()">
                    <label class="grid gap-1">
                      <span class="text-xs font-semibold text-slate-700">Foto de perfil</span>
                      <input class="rounded-xl border border-slate-200 bg-white p-1.5 text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectVerificationFile($event, 'profile')" />
                      @if (verificationProfileName()) {
                        <small class="text-[11px] text-emerald-700 font-medium">✓ {{ verificationProfileName() }}</small>
                      }
                    </label>

                    <label class="grid gap-1">
                      <span class="text-xs font-semibold text-slate-700">Foto del DNI</span>
                      <input class="rounded-xl border border-slate-200 bg-white p-1.5 text-xs" type="file" accept="image/jpeg,image/png,image/webp" (change)="selectVerificationFile($event, 'dni')" />
                      @if (verificationDniName()) {
                        <small class="text-[11px] text-emerald-700 font-medium">✓ {{ verificationDniName() }}</small>
                      }
                    </label>

                    <div class="grid gap-1">
                      <span class="text-xs font-semibold text-slate-700">Selfie en vivo</span>
                      <input
                        #selfieFallback
                        type="file"
                        accept="image/*"
                        capture="user"
                        class="hidden"
                        (change)="selectSelfieFile($event)"
                      />
                      <app-button type="button" variant="secondary" (click)="captureLiveSelfie(selfieFallback)">
                        {{ verificationSelfieReady() ? '✓ Selfie capturada (repetir)' : 'Abrir cámara para selfie' }}
                      </app-button>
                    </div>

                    @if (verificationSubmissionError()) {
                      <small class="text-xs text-red-600 font-semibold">{{ verificationSubmissionError() }}</small>
                    }

                    <app-button type="button" [disabled]="isSubmittingVerification()" (click)="submitCollaboratorVerification()">
                      {{ isSubmittingVerification() ? 'Enviando solicitud...' : 'Enviar para validación' }}
                    </app-button>
                  </form>
                </details>
              }
            </app-surface-card>

            <!-- TABS & LISTA CLIENTE -->
            <app-surface-card variant="page" extraClass="grid gap-3.5 p-4 sm:p-5">
              <div class="grid w-full min-w-0 grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1" role="tablist">
                <button
                  type="button"
                  class="min-h-10 min-w-0 rounded-xl px-2 text-xs font-bold transition"
                  [class]="customerScope() === 'active' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                  (click)="setCustomerScope('active')"
                >
                  Activos
                </button>
                <button
                  type="button"
                  class="min-h-10 min-w-0 rounded-xl px-2 text-xs font-bold transition"
                  [class]="customerScope() === 'completed' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                  (click)="setCustomerScope('completed')"
                >
                  Completados
                </button>
                <button
                  type="button"
                  class="min-h-10 min-w-0 rounded-xl px-2 text-xs font-bold transition"
                  [class]="customerScope() === 'cancelled' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                  (click)="setCustomerScope('cancelled')"
                >
                  Cancelados
                </button>
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>{{ filteredCustomerRequests().length }} solicitud(es)</span>
                <button type="button" class="font-bold text-primary-700 hover:underline" (click)="loadHub()">Actualizar</button>
              </div>

              @if (!filteredCustomerRequests().length) {
                <app-unified-empty-state
                  eyebrow="Sin favores"
                  title="No hay solicitudes en esta sección"
                  message="Cuando publiques un favor, podrás hacerle seguimiento desde aquí."
                />
              } @else {
                <div class="grid gap-3">
                  @for (request of filteredCustomerRequests(); track request.id) {
                    <a
                      class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs transition hover:border-primary-300 active:scale-99"
                      [routerLink]="['/community/requests', request.id]"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <span class="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 mb-1">
                            {{ requestTypeLabel(request.type) }}
                          </span>
                          <h3 class="font-bold text-sm text-slate-900 line-clamp-1">{{ request.title }}</h3>
                          <p class="text-xs text-slate-500 truncate mt-0.5">{{ request.originLabel }} → {{ request.destinationLabel }}</p>
                        </div>
                        <div class="shrink-0 text-right bg-emerald-50 px-2.5 py-1 rounded-xl">
                          <span class="block text-[9px] font-black uppercase text-emerald-700">Recompensa</span>
                          <span class="font-bold text-sm text-emerald-700">{{ request.compensationAmount | currency:'PEN':'S/ ':'1.2-2' }}</span>
                        </div>
                      </div>
                      <div class="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                        <app-status-badge [status]="request.status" [label]="mapCommunityStatusLabel(request.status)" />
                        @if (request.deadlineUtc) {
                          <span class="text-[11px] text-slate-400">Hasta {{ request.deadlineUtc | date:'shortTime' }}</span>
                        }
                      </div>
                    </a>
                  }
                </div>
              }
            </app-surface-card>
          }

          <!-- EXPERIENCIA COLLABORATOR: FAVORES DISPONIBLES -->
          @else if (communityMode() === 'collaborator') {
            <!-- DISPONIBILIDAD & RUTAS -->
            <details class="group min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
              <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
                <span class="min-w-0">
                  <strong class="block text-sm font-bold text-slate-950">Mi disponibilidad para ayudar</strong>
                  <span class="block truncate text-xs text-slate-500">Configura tu radio de cobertura y estado</span>
                </span>
                <span class="shrink-0 text-xs font-semibold text-primary-700 group-open:hidden">Configurar</span>
                <span class="hidden shrink-0 text-xs font-semibold text-slate-500 group-open:inline">Cerrar</span>
              </summary>
              <div class="grid gap-4 border-t border-slate-100 p-4 sm:p-5">
                <form class="grid gap-3 sm:grid-cols-2" [formGroup]="availabilityForm" (ngSubmit)="saveAvailability()">
                  <label class="grid gap-1.5">
                    <span class="text-xs font-semibold text-slate-700">Estado</span>
                    <select class="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700" formControlName="availabilityStatus">
                      <option value="Available">Disponible</option>
                      <option value="Busy">Ocupado</option>
                      <option value="Disconnected">Desconectado</option>
                    </select>
                  </label>

                  <label class="grid gap-1.5">
                    <span class="text-xs font-semibold text-slate-700">Radio de cobertura (km)</span>
                    <input class="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700" type="number" formControlName="availabilityRadiusKm" min="1" />
                  </label>

                  <div class="sm:col-span-2 pt-1">
                    <app-button type="submit" [disabled]="isSavingAvailability()" block>
                      {{ isSavingAvailability() ? 'Guardando...' : 'Guardar disponibilidad' }}
                    </app-button>
                  </div>
                </form>
              </div>
            </details>

            <!-- TABS & LISTA COLABORADOR -->
            <app-surface-card variant="page" extraClass="grid gap-3.5 p-4 sm:p-5">
              <div class="grid w-full min-w-0 grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1" role="tablist">
                <button
                  type="button"
                  class="min-h-10 min-w-0 rounded-xl px-2 text-xs font-bold transition"
                  [class]="collaboratorScope() === 'available' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                  (click)="setCollaboratorScope('available')"
                >
                  Disponibles
                </button>
                <button
                  type="button"
                  class="min-h-10 min-w-0 rounded-xl px-2 text-xs font-bold transition"
                  [class]="collaboratorScope() === 'taken' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                  (click)="setCollaboratorScope('taken')"
                >
                  Tomados
                </button>
                <button
                  type="button"
                  class="min-h-10 min-w-0 rounded-xl px-2 text-xs font-bold transition"
                  [class]="collaboratorScope() === 'history' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'"
                  (click)="setCollaboratorScope('history')"
                >
                  Historial
                </button>
              </div>

              <div class="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>{{ filteredCollaboratorRequests().length }} encargo(s)</span>
                <button type="button" class="font-bold text-primary-700 hover:underline" (click)="loadHub()">Actualizar</button>
              </div>

              @if (!filteredCollaboratorRequests().length) {
                <app-unified-empty-state
                  eyebrow="Sin favores"
                  [title]="collaboratorScope() === 'available' ? 'No hay favores disponibles por ahora' : 'No hay encargos en esta sección'"
                  message="Vuelve a revisar en unos minutos para ver nuevos favores solicitados."
                />
              } @else {
                <div class="grid gap-3">
                  @for (request of filteredCollaboratorRequests(); track request.id) {
                    <a
                      class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs transition hover:border-primary-300 active:scale-99"
                      [routerLink]="['/community/requests', request.id]"
                    >
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <span class="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 mb-1">
                            {{ requestTypeLabel(request.type) }}
                          </span>
                          <h3 class="font-bold text-sm text-slate-900 line-clamp-1">{{ request.title }}</h3>
                          <p class="text-xs text-slate-500 truncate mt-0.5">{{ request.originLabel }} → {{ request.destinationLabel }}</p>
                        </div>
                        <div class="shrink-0 text-right bg-emerald-50 px-2.5 py-1 rounded-xl">
                          <span class="block text-[9px] font-black uppercase text-emerald-700">Ganancia</span>
                          <span class="font-bold text-sm text-emerald-700">{{ request.collaboratorEarningAmount || request.compensationAmount | currency:'PEN':'S/ ':'1.2-2' }}</span>
                        </div>
                      </div>
                      <div class="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                        <app-status-badge [status]="request.status" [label]="mapCommunityStatusLabel(request.status)" />
                        @if (request.deadlineUtc) {
                          <span class="text-[11px] text-slate-400">Hasta {{ request.deadlineUtc | date:'shortTime' }}</span>
                        }
                      </div>
                    </a>
                  }
                </div>
              }
            </app-surface-card>
          }
        }
      }

      <app-location-map-picker-modal
        [isOpen]="isMapPickerOpen()"
        [target]="mapPickerTarget()"
        [title]="mapPickerTitle()"
        [initialLat]="mapPickerInitialLat()"
        [initialLng]="mapPickerInitialLng()"
        (selected)="onLocationSelectedFromMap($event)"
        (closed)="isMapPickerOpen.set(false)"
      />
    </app-mobile-page-shell>
  `,
})
export class CommunityHubPageComponent {
  private static readonly MAXIMUM_FAVOR_DURATION_MS = 24 * 60 * 60 * 1000;

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly communityApi = inject(CommunityApiService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly legalApi = inject(LegalApiService);

  readonly storeIcon = Store;
  readonly shieldIcon = ShieldCheck;
  readonly sparklesIcon = Sparkles;

  readonly activeProfile = computed(() => this.authService.activeProfile());
  readonly currentRole = computed(() => this.authService.currentRole());
  readonly currentUser = computed(() => this.authService.currentUser());

  readonly communityMode = computed<CommunityMode>(() => {
    const profile = this.activeProfile();
    if (profile === 'BusinessOwner') return 'business-blocked';
    if (profile === 'Admin') return 'admin-redirect';
    if (profile === 'Collaborator') return 'collaborator';
    if (profile === 'Driver') return 'driver';
    return 'customer';
  });

  readonly isApprovedCollaborator = computed(() => {
    const user = this.currentUser();
    return user?.hasCollaboratorProfile && user?.collaboratorApprovalStatus === 'Approved';
  });

  readonly collaborator = signal<CommunityCollaboratorResponse | null>(null);
  readonly requests = signal<CommunityRequestListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isCreatingRequest = signal(false);
  readonly isSavingAvailability = signal(false);
  readonly isSubmittingVerification = signal(false);

  readonly customerScope = signal<CustomerScope>('active');
  readonly collaboratorScope = signal<CollaboratorScope>('available');

  readonly verificationStatus = signal('NotVerified');
  readonly verificationSelfieReady = signal(false);
  readonly verificationProfileName = signal('');
  readonly verificationDniName = signal('');
  readonly verificationSubmissionError = signal('');

  private verificationProfileFile: File | null = null;
  private verificationDniFile: File | null = null;
  private verificationSelfieFile: File | null = null;

  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly deadlineMinimum = signal(this.toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000)));
  readonly deadlineMaximum = signal(this.toLocalInputValue(new Date(Date.now() + CommunityHubPageComponent.MAXIMUM_FAVOR_DURATION_MS)));

  readonly defaultBackUrl = computed(() => {
    const profile = this.activeProfile();
    if (profile === 'BusinessOwner') return '/business/dashboard';
    if (profile === 'Driver') return '/driver/dashboard';
    return '/businesses';
  });

  readonly pageTitle = computed(() => {
    if (this.communityMode() === 'collaborator') return 'Favores disponibles';
    return 'Mis favores';
  });

  readonly pageSubtitle = computed(() => {
    if (this.communityMode() === 'collaborator') return 'Elige encargos que puedes tomar cerca de ti.';
    return 'Solicita ayuda y revisa el estado de tus encargos.';
  });

  readonly mapPinIcon = MapPin;
  readonly isDetectingLocation = signal(false);

  readonly isMapPickerOpen = signal(false);
  readonly mapPickerTarget = signal<'origin' | 'destination' | 'both'>('both');
  readonly mapPickerTitle = signal('Elegir ubicación en el mapa');

  readonly mapPickerInitialLat = computed(() => {
    const target = this.mapPickerTarget();
    return target === 'origin'
      ? this.requestForm.controls.originLatitude.value
      : this.requestForm.controls.destinationLatitude.value;
  });

  readonly mapPickerInitialLng = computed(() => {
    const target = this.mapPickerTarget();
    return target === 'origin'
      ? this.requestForm.controls.originLongitude.value
      : this.requestForm.controls.destinationLongitude.value;
  });

  readonly availabilityForm = this.formBuilder.nonNullable.group({
    availabilityStatus: 'Available',
    availabilityRadiusKm: [5, [Validators.required, Validators.min(1)]],
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
    compensationAmount: [5, [Validators.required, Validators.min(1)]],
    deadlineUtc: [this.defaultFavorDeadline(), Validators.required],
  });

  readonly filteredCustomerRequests = computed(() => {
    const scope = this.customerScope();
    const reqs = this.requests();

    switch (scope) {
      case 'completed':
        return reqs.filter((r) => r.status === 'Confirmed' || r.status === 'Delivered');
      case 'cancelled':
        return reqs.filter((r) => r.status === 'Cancelled');
      case 'active':
      default:
        return reqs.filter((r) => ['Published', 'Searching', 'Accepted', 'InProcess'].includes(r.status));
    }
  });

  readonly filteredCollaboratorRequests = computed(() => {
    const scope = this.collaboratorScope();
    const reqs = this.requests();

    switch (scope) {
      case 'taken':
        return reqs.filter((r) => r.isAssignedToMe && ['Accepted', 'InProcess', 'Delivered'].includes(r.status));
      case 'history':
        return reqs.filter((r) => r.isAssignedToMe && ['Confirmed', 'Cancelled'].includes(r.status));
      case 'available':
      default:
        return reqs.filter((r) => !r.isMine && !r.isAssignedToMe && ['Published', 'Searching'].includes(r.status));
    }
  });

  constructor() {
    this.loadHub();
  }

  loadHub(): void {
    const mode = this.communityMode();
    if (mode === 'business-blocked' || mode === 'admin-redirect') {
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    if (mode === 'collaborator') {
      const scope = this.collaboratorScope();
      const viewParam = scope === 'taken' ? 'assigned' : scope === 'history' ? 'history' : 'available';

      forkJoin({
        collaborator: this.communityApi.getMyCollaborator().pipe(catchError(() => of(null))),
        requests: this.communityApi.getRequests({ view: viewParam }).pipe(catchError(() => of([]))),
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ collaborator, requests }) => {
            this.collaborator.set(collaborator);
            this.requests.set(requests);
            if (collaborator) {
              this.availabilityForm.patchValue({
                availabilityStatus: collaborator.availabilityStatus,
                availabilityRadiusKm: collaborator.availabilityRadiusKm,
              });
            }
            this.isLoading.set(false);
          },
          error: () => {
            this.errorMessage.set('No pudimos cargar los favores disponibles.');
            this.isLoading.set(false);
          },
        });
    } else {
      // Customer or Driver mode
      forkJoin({
        verification: this.communityApi.getMyVerification().pipe(catchError(() => of(null))),
        requests: this.communityApi.getRequests({ view: 'my' }).pipe(catchError(() => of([]))),
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ verification, requests }) => {
            if (verification) {
              this.verificationStatus.set(verification.status);
            }
            this.requests.set(requests);
            this.isLoading.set(false);
          },
          error: () => {
            this.errorMessage.set('No pudimos cargar tus favores.');
            this.isLoading.set(false);
          },
        });
    }
  }

  setCustomerScope(scope: CustomerScope): void {
    this.customerScope.set(scope);
  }

  setCollaboratorScope(scope: CollaboratorScope): void {
    this.collaboratorScope.set(scope);
    this.loadHub();
  }

  switchToCustomer(): void {
    this.authService.switchProfile('Customer').subscribe({
      next: () => {
        void this.router.navigate(['/businesses']);
      },
    });
  }

  switchToCollaborator(): void {
    this.authService.switchProfile('Collaborator').subscribe({
      next: () => {
        this.loadHub();
      },
      error: (err: { error?: { message?: string } }) => {
        this.errorMessage.set(err.error?.message || 'Tu perfil aún no está habilitado como colaborador.');
      },
    });
  }

  detectLocation(target: 'origin' | 'destination'): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.errorMessage.set('Tu dispositivo no soporta geolocalización.');
      return;
    }

    this.isDetectingLocation.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.isDetectingLocation.set(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        if (target === 'origin') {
          this.requestForm.patchValue({
            originLatitude: lat,
            originLongitude: lng,
          });
          if (!this.requestForm.controls.originLabel.value) {
            this.requestForm.patchValue({ originLabel: `Ubicación GPS (${lat}, ${lng})` });
          }
        } else {
          this.requestForm.patchValue({
            destinationLatitude: lat,
            destinationLongitude: lng,
          });
          if (!this.requestForm.controls.destinationLabel.value) {
            this.requestForm.patchValue({ destinationLabel: `Ubicación GPS (${lat}, ${lng})` });
          }
        }
      },
      () => {
        this.isDetectingLocation.set(false);
        this.errorMessage.set('No se pudo obtener la ubicación GPS. Verifica los permisos de ubicación.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  openMapPicker(target: 'origin' | 'destination'): void {
    this.mapPickerTarget.set(target);
    this.mapPickerTitle.set(target === 'origin' ? 'Elegir punto de recojo en el mapa' : 'Elegir punto de entrega en el mapa');
    this.isMapPickerOpen.set(true);
  }

  onLocationSelectedFromMap(event: { lat: number; lng: number; label: string; target: 'origin' | 'destination' }): void {
    if (event.target === 'origin') {
      this.requestForm.patchValue({
        originLatitude: event.lat,
        originLongitude: event.lng,
        originLabel: event.label,
      });
    } else {
      this.requestForm.patchValue({
        destinationLatitude: event.lat,
        destinationLongitude: event.lng,
        destinationLabel: event.label,
      });
    }
  }

  createRequest(): void {
    if (this.requestForm.invalid) {
      this.errorMessage.set('Por favor completa todos los campos requeridos para publicar el favor.');
      return;
    }

    this.isCreatingRequest.set(true);
    this.errorMessage.set('');

    const values = this.requestForm.getRawValue();
    this.communityApi
      .createRequest({
        type: values.type,
        title: values.title,
        description: values.description,
        originLabel: values.originLabel,
        originLatitude: values.originLatitude,
        originLongitude: values.originLongitude,
        destinationLabel: values.destinationLabel,
        destinationLatitude: values.destinationLatitude,
        destinationLongitude: values.destinationLongitude,
        compensationAmount: values.compensationAmount,
        deadlineUtc: values.deadlineUtc ? new Date(values.deadlineUtc).toISOString() : null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isCreatingRequest.set(false);
          this.successMessage.set('¡Tu favor fue publicado con éxito!');
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
            compensationAmount: 5,
            deadlineUtc: this.defaultFavorDeadline(),
          });
          this.loadHub();
        },
        error: (err: { error?: { message?: string } }) => {
          this.isCreatingRequest.set(false);
          this.errorMessage.set(err.error?.message || 'No se pudo crear el favor.');
        },
      });
  }

  saveAvailability(): void {
    const values = this.availabilityForm.getRawValue();
    this.isSavingAvailability.set(true);
    this.communityApi
      .updateMyCollaborator({
        isAvailable: values.availabilityStatus === 'Available',
        availabilityStatus: values.availabilityStatus,
        availabilityRadiusKm: values.availabilityRadiusKm,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSavingAvailability.set(false);
          this.collaborator.set(res);
          this.successMessage.set('Disponibilidad actualizada.');
        },
        error: () => {
          this.isSavingAvailability.set(false);
          this.errorMessage.set('No se pudo guardar la disponibilidad.');
        },
      });
  }

  selectVerificationFile(event: Event, type: 'profile' | 'dni'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    if (type === 'profile') {
      this.verificationProfileFile = file;
      this.verificationProfileName.set(file?.name ?? '');
    } else {
      this.verificationDniFile = file;
      this.verificationDniName.set(file?.name ?? '');
    }
  }

  async captureLiveSelfie(fileInputFallback?: HTMLInputElement): Promise<void> {
    this.verificationSubmissionError.set('');
    try {
      const { Camera, CameraDirection, CameraResultType, CameraSource } = await import('@capacitor/camera');

      try {
        const check = await Camera.checkPermissions();
        if (check.camera !== 'granted') {
          await Camera.requestPermissions({ permissions: ['camera'] });
        }
      } catch {
        // Continuar con getPhoto
      }

      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Front,
      });

      if (photo.dataUrl) {
        this.verificationSelfieFile = this.dataUrlToFile(photo.dataUrl, 'live-selfie.jpg');
        this.verificationSelfieReady.set(true);
        return;
      }
    } catch (err) {
      console.warn('Capacitor camera no disponible o cancelado, usando selector de cámara nativo.', err);
      if (fileInputFallback) {
        fileInputFallback.click();
        return;
      }
    }
  }

  selectSelfieFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;
    if (file) {
      this.verificationSelfieFile = file;
      this.verificationSelfieReady.set(true);
    }
  }

  private dataUrlToFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  submitCollaboratorVerification(): void {
    if (!this.verificationProfileFile || !this.verificationDniFile || !this.verificationSelfieFile) {
      this.verificationSubmissionError.set('Debes adjuntar foto de perfil, DNI y tomar la selfie en vivo.');
      return;
    }

    this.isSubmittingVerification.set(true);
    this.verificationSubmissionError.set('');

    const formData = new FormData();
    formData.append('profilePhoto', this.verificationProfileFile);
    formData.append('identityDocument', this.verificationDniFile);
    formData.append('liveSelfie', this.verificationSelfieFile);

    this.communityApi
      .submitVerification(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmittingVerification.set(false);
          this.verificationStatus.set(res.status);
          this.successMessage.set('¡Solicitud de verificación enviada con éxito!');
        },
        error: (err: { error?: { message?: string } }) => {
          this.isSubmittingVerification.set(false);
          this.verificationSubmissionError.set(err.error?.message || 'Error al enviar validación.');
        },
      });
  }

  mapCommunityStatusLabel(status: string): string {
    const map: Record<string, string> = {
      Published: 'Publicado',
      Searching: 'Buscando apoyo',
      Accepted: 'Asignado',
      InProcess: 'En proceso',
      Delivered: 'Entregado',
      Confirmed: 'Confirmado',
      Completed: 'Completado',
      Cancelled: 'Cancelado',
    };
    return map[status] ?? status;
  }

  requestTypeLabel(type: string): string {
    const map: Record<string, string> = {
      MarketPurchase: 'Compra de mercado',
      Errand: 'Encargo',
      ProductPickup: 'Recojo de producto',
      PackageDelivery: 'Envío de paquete',
      CompensatedFavor: 'Favor',
    };
    return map[type] ?? type;
  }

  verificationStatusLabel(): string {
    const status = this.verificationStatus();
    if (status === 'Verified') return 'Aprobado';
    if (status === 'PendingVerification') return 'En revisión';
    if (status === 'Rejected') return 'Rechazado';
    return 'No activado';
  }

  verificationBadgeClass(): string {
    const status = this.verificationStatus();
    if (status === 'Verified') return 'bg-emerald-100 text-emerald-800';
    if (status === 'PendingVerification') return 'bg-amber-100 text-amber-800';
    if (status === 'Rejected') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-600';
  }

  private defaultFavorDeadline(): string {
    return this.toLocalInputValue(new Date(Date.now() + 4 * 60 * 60 * 1000));
  }

  private toLocalInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}

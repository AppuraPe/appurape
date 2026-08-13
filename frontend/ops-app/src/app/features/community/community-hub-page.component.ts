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
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

type RequestScope = 'active' | 'completed' | 'cancelled' | 'available' | 'taken' | 'history';
type HubMode = 'requester' | 'collaborator';
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
    AppSurfaceCardComponent,
    MobilePageShellComponent,
    InternalPageSectionHeaderComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
  ],
  template: `
    <app-mobile-page-shell
      [topSafeArea]="false"
      extraClass="space-y-4 px-4 pt-4 sm:px-5 lg:px-0 lg:pt-0"
      bottomSpacingClass="pb-0"
    >
      <app-back-button fallbackUrl="/businesses" label="Volver a negocios" />

      <section class="grid min-w-0 gap-3 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <app-internal-page-section-header
          eyebrow="Favores"
          [title]="pageTitle()"
          [subtitle]="pageSubtitle()"
        />

        @if (isCustomerView()) {
          <div class="grid min-w-0 grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Elegir cómo participar en Favores">
            <button
              type="button"
              class="min-h-11 min-w-0 rounded-xl px-2 text-xs font-semibold transition min-[360px]:text-sm"
              [class]="hubModeClass('requester')"
              (click)="selectHubMode('requester')"
            >
              Necesito ayuda
            </button>
            <button
              type="button"
              class="min-h-11 min-w-0 rounded-xl px-2 text-xs font-semibold transition min-[360px]:text-sm"
              [class]="hubModeClass('collaborator')"
              (click)="selectHubMode('collaborator')"
            >
              Quiero ayudar
            </button>
          </div>
        }
      </section>

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
      } @else {
        @if (isCustomerView() && isCollaboratorView() && !isApprovedCollaborator()) {
          <app-notice
            tone="warning"
            title="Valida tu identidad para colaborar"
            message="Antes de ayudar debes registrar una foto de perfil, enviar la foto de tu DNI, tomar una selfie en vivo con la cámara y esperar la aprobación de AppuraPe. Hasta entonces no podrás activar tu disponibilidad ni postularte."
          />
        }

        @if (isCollaboratorView() && collaborator() && (!isCustomerView() || isApprovedCollaborator())) {
        <details class="group min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
          <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
            <span class="min-w-0">
              <strong class="block text-sm text-slate-950">Mi disponibilidad</strong>
              <span class="block truncate text-xs text-slate-500">Configura cuándo quieres colaborar</span>
            </span>
            <span class="shrink-0 text-xs font-semibold text-red-500 group-open:hidden">Configurar</span>
            <span class="hidden shrink-0 text-xs font-semibold text-slate-500 group-open:inline">Cerrar</span>
          </summary>
          <div class="grid gap-4 border-t border-slate-100 p-4 sm:p-5">
          <app-internal-page-section-header
            eyebrow="Tu perfil"
            title="Participa como solicitante o colaborador"
            subtitle="Activa tu disponibilidad y mantén tus rutas al día para recibir mejores coincidencias."
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
          </div>
        </details>
        }

        @if (isRequesterView()) {
        <details class="group min-w-0 overflow-hidden rounded-[20px] border border-red-100 bg-white shadow-sm">
          <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
            <span class="min-w-0">
              <strong class="block text-sm text-slate-950">Publicar un favor</strong>
              <span class="block truncate text-xs text-slate-500">Crea una solicitud válida por un máximo de 24 horas</span>
            </span>
            <span class="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 group-open:hidden">Nuevo</span>
            <span class="hidden shrink-0 text-xs font-semibold text-slate-500 group-open:inline">Cerrar</span>
          </summary>
          <div class="grid gap-4 border-t border-red-50 p-4 sm:p-5">
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

              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-semibold text-slate-700">Pago al colaborador</span>
                <div class="relative min-w-0">
                  <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-bold text-slate-500">S/</span>
                  <input class="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700" type="number" step="0.01" min="0" formControlName="compensationAmount" />
                </div>
                <small class="text-xs leading-5 text-slate-500">La tarifa de servicio AppuraPe se muestra por separado antes de confirmar.</small>
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

              <details class="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:col-span-2">
                <summary class="cursor-pointer text-sm font-semibold text-slate-700">Ubicación precisa (opcional)</summary>
                <p class="mt-1 text-xs leading-5 text-slate-500">Completa coordenadas solo si necesitas mejorar la coincidencia por cercanía.</p>
                <div class="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-semibold text-slate-700">Latitud origen</span>
                <input class="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="originLatitude" />
              </label>

              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-semibold text-slate-700">Longitud origen</span>
                <input class="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="originLongitude" />
              </label>

              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-semibold text-slate-700">Latitud destino</span>
                <input class="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="destinationLatitude" />
              </label>

              <label class="grid min-w-0 gap-2">
                <span class="text-sm font-semibold text-slate-700">Longitud destino</span>
                <input class="min-h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700" type="number" step="0.000001" formControlName="destinationLongitude" />
              </label>
                </div>
              </details>

              <label class="grid gap-2 sm:col-span-2">
                <span class="text-sm font-semibold text-slate-700">Fecha límite</span>
                <input
                  class="min-h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  type="datetime-local"
                  formControlName="deadlineUtc"
                  [min]="deadlineMinimum()"
                  [max]="deadlineMaximum()"
                />
                <small class="text-xs leading-5 text-slate-500">Debe vencer dentro de las próximas 24 horas.</small>
              </label>
            </div>

            <app-button type="submit" [disabled]="isCreatingRequest()" block>
              {{ isCreatingRequest() ? 'Publicando solicitud...' : 'Publicar solicitud' }}
            </app-button>
          </form>
          </div>
        </details>
        }

        <div class="grid gap-4">
          @if (isCollaboratorView() && (!isCustomerView() || isApprovedCollaborator())) {
          <details class="group order-2 min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
            <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
              <span class="min-w-0">
                <strong class="block text-sm text-slate-950">Mis trayectos habituales</strong>
                <span class="block truncate text-xs text-slate-500">{{ routes().length }} rutas para mejorar coincidencias</span>
              </span>
              <span class="shrink-0 text-xs font-semibold text-red-500 group-open:hidden">Gestionar</span>
              <span class="hidden shrink-0 text-xs font-semibold text-slate-500 group-open:inline">Cerrar</span>
            </summary>
            <div class="grid gap-4 border-t border-slate-100 p-4 sm:p-5">
            <app-internal-page-section-header
              eyebrow="Tus trayectos"
              title="Rutas para mejorar coincidencias"
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
                message="Guarda al menos un trayecto para recibir mejores coincidencias con favores cercanos."
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
            </div>
          </details>
          }

          <app-surface-card class="order-1" variant="page" extraClass="grid gap-4 p-4 sm:p-5">
            <div class="grid w-full min-w-0 grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Filtrar favores">
              @if (isCollaboratorView()) {
              <button
                type="button"
                class="min-h-10 min-w-0 rounded-xl px-1.5 text-[11px] font-semibold leading-tight transition min-[360px]:px-2 min-[360px]:text-xs"
                [class]="scopeChipClass('available')"
                (click)="selectedScope.set('available')"
              >
                Disponibles
              </button>
              <button
                type="button"
                class="min-h-10 min-w-0 rounded-xl px-1.5 text-[11px] font-semibold leading-tight transition min-[360px]:px-2 min-[360px]:text-xs"
                [class]="scopeChipClass('taken')"
                (click)="selectedScope.set('taken')"
              >
                Tomados
              </button>
              <button
                type="button"
                class="min-h-10 min-w-0 rounded-xl px-1.5 text-[11px] font-semibold leading-tight transition min-[360px]:px-2 min-[360px]:text-xs"
                [class]="scopeChipClass('history')"
                (click)="selectedScope.set('history')"
              >
                Historial
              </button>
              } @else {
              <button type="button" class="min-h-10 min-w-0 rounded-xl px-1.5 text-[11px] font-semibold leading-tight transition min-[360px]:px-2 min-[360px]:text-xs" [class]="scopeChipClass('active')" (click)="selectedScope.set('active')">Activos</button>
              <button type="button" class="min-h-10 min-w-0 rounded-xl px-1.5 text-[11px] font-semibold leading-tight transition min-[360px]:px-2 min-[360px]:text-xs" [class]="scopeChipClass('completed')" (click)="selectedScope.set('completed')">Completados</button>
              <button type="button" class="min-h-10 min-w-0 rounded-xl px-1.5 text-[11px] font-semibold leading-tight transition min-[360px]:px-2 min-[360px]:text-xs" [class]="scopeChipClass('cancelled')" (click)="selectedScope.set('cancelled')">Cancelados</button>
              }
            </div>

            <div class="flex items-center justify-between gap-3 rounded-[20px] bg-slate-100/90 px-4 py-3 text-sm text-slate-600">
              <p class="min-w-0">{{ requestsSummary() }}</p>
              <app-button variant="ghost" type="button" [disabled]="isLoading()" (click)="loadHub()">Recargar</app-button>
            </div>

            @if (!filteredRequests().length) {
              <app-unified-empty-state
                eyebrow="Sin resultados"
                [title]="emptyTitle()"
                [message]="emptyMessage()"
              />
            } @else {
              <div class="grid gap-3">
                @for (request of filteredRequests(); track request.id) {
                  <a
                    class="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-red-200"
                    [routerLink]="['/community/requests', request.id]"
                  >
                    <div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <div class="min-w-0">
                        <p class="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                          {{ requestTypeLabel(request.type) }}
                        </p>
                        <h3 class="mt-1 line-clamp-2 min-w-0 text-base font-extrabold tracking-tight text-slate-950">{{ request.title }}</h3>
                        <p class="mt-1 min-w-0 truncate text-sm text-slate-500">{{ request.originLabel }} → {{ request.destinationLabel }}</p>
                      </div>
                      <app-status-badge class="max-w-[104px]" [status]="request.status" [label]="displayStatusLabel(request)" />
                    </div>

                    <div class="flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500">
                      @if (request.isMine) {
                        <app-status-badge status="verified" label="Mi solicitud" />
                      }
                      @if (request.isAssignedToMe) {
                        <app-status-badge status="trusted" label="Asignada a mí" />
                      }
                      @if (isCollaboratorView() && selectedScope() === 'available') {
                        <span>Coincidencia {{ formatMatchScore(request.matchScore) }}</span>
                      }
                    </div>

                    <div class="grid gap-2 rounded-[20px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div class="flex items-center justify-between gap-3">
                        <span>Recompensa</span>
                        <strong class="text-slate-950">{{ request.compensationAmount | currency:'PEN':'S/ ':'1.2-2' }}</strong>
                      </div>
                      @if (request.deadlineUtc) {
                        <div class="flex items-center justify-between gap-3">
                          <span>Límite</span>
                          <span class="text-right text-slate-500">{{ request.deadlineUtc | date:'short' }}</span>
                        </div>
                      }
                    </div>

                    <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
                      <span class="inline-flex min-h-9 items-center rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-600">
                        {{ requestActionLabel(request) }}
                      </span>
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
  private static readonly MAXIMUM_FAVOR_DURATION_MS = 24 * 60 * 60 * 1000;
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
  readonly isDriverView = computed(() => this.authService.currentRole() === 'Driver');
  readonly isCustomerView = computed(() => this.authService.currentRole() === 'Customer');
  readonly hubMode = signal<HubMode>(this.authService.currentRole() === 'Driver' ? 'collaborator' : 'requester');
  readonly isCollaboratorView = computed(() => this.isDriverView() || this.hubMode() === 'collaborator');
  readonly isRequesterView = computed(() => this.isCustomerView() && this.hubMode() === 'requester');
  readonly isApprovedCollaborator = computed(() => {
    const collaborator = this.collaborator();
    return !!collaborator &&
      collaborator.collaboratorApprovalStatus === 'Approved' &&
      collaborator.isIdentityVerified;
  });
  readonly selectedScope = signal<RequestScope>(this.authService.currentRole() === 'Driver' ? 'available' : 'active');
  readonly deadlineMinimum = signal(this.toLocalInputValue(new Date(Date.now() + 5 * 60 * 1000)));
  readonly deadlineMaximum = signal(this.toLocalInputValue(new Date(Date.now() + CommunityHubPageComponent.MAXIMUM_FAVOR_DURATION_MS)));

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
    deadlineUtc: [this.defaultFavorDeadline(), Validators.required],
  });

  readonly filteredRequests = computed(() => {
    const scope = this.selectedScope();
    const requests = this.requests();

    if (this.isCollaboratorView()) {
      switch (scope) {
        case 'taken':
          return requests.filter(
            (request) => request.isAssignedToMe && ['Accepted', 'InProcess', 'Delivered'].includes(request.status),
          );
        case 'history':
          return requests.filter(
            (request) => request.isAssignedToMe && ['Confirmed', 'Cancelled'].includes(request.status),
          );
        default:
          return requests.filter((request) =>
            !request.isMine &&
            !request.isAssignedToMe &&
            ['Published', 'Searching'].includes(request.status) &&
            (!request.deadlineUtc || new Date(request.deadlineUtc).getTime() > Date.now()),
          );
      }
    }

    const mine = requests.filter((request) => request.isMine);
    switch (scope) {
      case 'completed':
        return mine.filter((request) => request.status === 'Confirmed');
      case 'cancelled':
        return mine.filter((request) => request.status === 'Cancelled');
      default:
        return mine.filter((request) => ['Published', 'Searching', 'Accepted', 'InProcess', 'Delivered'].includes(request.status));
    }
  });

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
    const scope = this.selectedScope();

    if (this.isCollaboratorView()) {
      if (scope === 'taken') {
        return count === 1 ? 'Tienes 1 favor en seguimiento.' : `Tienes ${count} favores en seguimiento.`;
      }
      if (scope === 'history') {
        return count === 1 ? 'Tienes 1 favor en tu historial.' : `Tienes ${count} favores en tu historial.`;
      }
      return count === 1 ? 'Hay 1 favor disponible para tomar.' : `Hay ${count} favores disponibles para tomar.`;
    }

    if (scope === 'completed') {
      return count === 1 ? 'Completaste 1 favor.' : `Completaste ${count} favores.`;
    }
    if (scope === 'cancelled') {
      return count === 1 ? 'Tienes 1 favor cancelado.' : `Tienes ${count} favores cancelados.`;
    }
    return count === 1 ? 'Tienes 1 favor activo.' : `Tienes ${count} favores activos.`;
  });

  readonly pageTitle = computed(() => this.isCollaboratorView() ? 'Favores disponibles' : 'Mis favores');
  readonly pageSubtitle = computed(() => this.isCollaboratorView()
    ? 'Encuentra encargos cercanos en los que puedes colaborar.'
    : 'Publica solicitudes y revisa su estado.');
  readonly emptyTitle = computed(() => this.isCollaboratorView() && this.selectedScope() === 'available'
    ? 'No hay favores disponibles por ahora'
    : 'No hay favores en esta sección');
  readonly emptyMessage = computed(() => this.isCollaboratorView() && this.selectedScope() === 'available'
    ? 'Vuelve a revisar en unos minutos.'
    : 'Cuando haya actividad, aparecerá aquí.');

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

    const collaboratorLoad$ = (this.isCollaboratorView()
      ? this.wrapLoad(
          this.communityApi.getMyCollaborator(),
          null,
          'No pudimos cargar tu perfil colaborador',
        )
      : of({ data: null, warning: null } satisfies HubLoadResult<CommunityCollaboratorResponse | null>))
      .pipe(shareReplay({ bufferSize: 1, refCount: true }));

    forkJoin({
      collaborator: collaboratorLoad$,
      routes: collaboratorLoad$.pipe(
        switchMap((collaborator) =>
          this.isCollaboratorView() && collaborator.data
            ? this.wrapLoad(this.communityApi.getMyRoutes(), [], 'No pudimos cargar rutas disponibles')
            : of({ data: [], warning: null } satisfies HubLoadResult<CommunityRouteResponse[]>),
        ),
      ),
      requests: this.wrapLoad(
        this.communityApi.getRequests(this.isCollaboratorView() ? {} : { mine: true }),
        [],
        'No pudimos cargar tus solicitudes',
      ),
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
          this.errorMessage.set(getErrorMessage(error, 'No pudimos cargar Favores. Intenta nuevamente.'));
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
    const deadlineValue = this.requestForm.controls.deadlineUtc.value;
    const deadline = deadlineValue ? new Date(deadlineValue) : null;
    const now = Date.now();
    if (
      !deadline ||
      Number.isNaN(deadline.getTime()) ||
      deadline.getTime() <= now ||
      deadline.getTime() > now + CommunityHubPageComponent.MAXIMUM_FAVOR_DURATION_MS
    ) {
      this.requestForm.controls.deadlineUtc.markAsTouched();
      const message = 'Elige una fecha límite futura dentro de las próximas 24 horas.';
      this.errorMessage.set(message);
      this.notificationService.warning(message);
      return;
    }

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
            deadlineUtc: this.defaultFavorDeadline(),
          });
          this.selectedScope.set('active');
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

  scopeChipClass(scope: RequestScope): string {
    return this.selectedScope() === scope
      ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200'
      : 'text-slate-600';
  }

  hubModeClass(mode: HubMode): string {
    return this.hubMode() === mode
      ? 'bg-white text-red-600 shadow-sm ring-1 ring-slate-200'
      : 'text-slate-600';
  }

  selectHubMode(mode: HubMode): void {
    if (this.hubMode() === mode) {
      return;
    }

    this.hubMode.set(mode);
    this.selectedScope.set(mode === 'collaborator' ? 'available' : 'active');
    this.successMessage.set('');
    this.loadHub();
  }

  displayStatusLabel(request: CommunityRequestListItemResponse): string {
    if (this.isCollaboratorView() && ['Published', 'Searching'].includes(request.status)) {
      return 'Disponible';
    }

    if (request.status === 'Accepted') {
      return 'Tomado';
    }

    return this.requestStatusLabel(request.status);
  }

  requestActionLabel(request: CommunityRequestListItemResponse): string {
    if (this.isCollaboratorView() && ['Published', 'Searching'].includes(request.status)) {
      return 'Tomar favor';
    }

    return ['Confirmed', 'Cancelled'].includes(request.status) ? 'Ver historial' : 'Ver seguimiento';
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

  private defaultFavorDeadline(): string {
    return this.toLocalInputValue(new Date(Date.now() + 4 * 60 * 60 * 1000));
  }

  private toLocalInputValue(value: Date): string {
    const localTime = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
    return localTime.toISOString().slice(0, 16);
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

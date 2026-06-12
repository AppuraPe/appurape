import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArrowRight, Clock3, LucideAngularModule, MapPin, ShoppingBag, Star } from 'lucide-angular';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessListItemResponse,
  BusinessZoneListItemResponse,
  PublicBusinessSearchResponse,
} from '../../core/models/businesses.models';
import { BusinessesApiService } from '../../core/services/businesses-api.service';
import { ZonesApiService } from '../../core/services/zones-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { BusinessesFiltersCardComponent } from './businesses-filters-card.component';
import { BusinessesBusinessCardComponent } from './businesses-business-card.component';
import { BusinessesHeroSectionComponent } from './businesses-hero-section.component';
import { BusinessesPageContainerComponent } from './businesses-page-container.component';
import { MenuCardComponent } from '../restaurants/components/menu-card.component';
import { SectionHeaderComponent } from '../restaurants/components/section-header.component';
import { StateCardComponent } from '../restaurants/components/state-card.component';

type BrowseResultsState = {
  mode: 'browse';
  restaurants: BusinessListItemResponse[];
};

type SearchResultsState = {
  mode: 'search';
  searchResults: PublicBusinessSearchResponse;
};

type RestaurantListViewState = BrowseResultsState | SearchResultsState;

@Component({
  selector: 'app-business-list-page',
  standalone: true,
  imports: [
    BusinessesPageContainerComponent,
    BusinessesHeroSectionComponent,
    BusinessesFiltersCardComponent,
    BusinessesBusinessCardComponent,
    SectionHeaderComponent,
    StateCardComponent,
    MenuCardComponent,
    CurrencyPipe,
    RouterLink,
    LucideAngularModule,
  ],
  templateUrl: './business-list-page.component.html',
})
export class BusinessListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessesApi = inject(BusinessesApiService);
  private readonly zonesApi = inject(ZonesApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private latestRequestId = 0;

  readonly restaurants = signal<BusinessListItemResponse[]>([]);
  readonly searchResults = signal<PublicBusinessSearchResponse | null>(null);
  readonly zones = signal<BusinessZoneListItemResponse[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingZones = signal(true);
  readonly errorMessage = signal('');
  readonly zonesErrorMessage = signal('');
  readonly appliedQuery = signal('');
  readonly appliedZoneId = signal('');
  readonly hasText = hasText;

  readonly searchForm = this.formBuilder.nonNullable.group({
    q: '',
    zoneId: '',
  });

  readonly isSearchMode = computed(() => hasText(this.appliedQuery()));
  readonly hasZoneFilter = computed(() => !this.isSearchMode() && hasText(this.appliedZoneId()));
  readonly hasActiveFilters = computed(() => hasText(this.appliedQuery()) || hasText(this.appliedZoneId()));
  readonly foods = computed(() => this.searchResults()?.foods ?? []);
  readonly relatedRestaurants = computed(() => this.searchResults()?.restaurants ?? []);
  readonly appliedZoneName = computed(
    () => this.zones().find((zone) => zone.id === this.appliedZoneId())?.name ?? '',
  );
  readonly browseSummary = computed(() => {
    const count = this.restaurants().length;
    const label = count === 1 ? '1 negocio disponible' : `${count} negocios disponibles`;

    if (hasText(this.appliedZoneName())) {
      return `${label} en ${this.appliedZoneName()}.`;
    }

    return `${label} para explorar ahora.`;
  });
  readonly searchSummary = computed(() => {
    const foods = this.foods().length;
    const restaurants = this.relatedRestaurants().length;
    const foodsLabel = foods === 1 ? '1 comida' : `${foods} comidas`;
    const restaurantsLabel = restaurants === 1 ? '1 negocio' : `${restaurants} negocios`;

    return `${foodsLabel} y ${restaurantsLabel} relacionados encontrados.`;
  });
  readonly heroBackgroundImageUrl = this.buildHeroBackgroundImageUrl();
  readonly starIcon = Star;
  readonly clockIcon = Clock3;
  readonly mapPinIcon = MapPin;
  readonly shoppingBagIcon = ShoppingBag;
  readonly arrowRightIcon = ArrowRight;

  constructor() {
    this.loadZones();
    this.syncFormWithQueryParams();
    this.bindQueryParamsToResults();
    this.bindFormToQueryParams();
  }

  clearFilters(): void {
    this.searchForm.setValue({
      q: '',
      zoneId: '',
    });
  }

  clearSearch(): void {
    this.searchForm.controls.q.setValue('');
  }

  hasZone(restaurant: BusinessListItemResponse): boolean {
    return hasText(restaurant.zoneName);
  }

  getInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || 'A';
  }

  formatSchedule(openTime: string, closeTime: string): string {
    return `${formatTimeSpan(openTime)} - ${formatTimeSpan(closeTime)}`;
  }

  emptyStateTitle(): string {
    if (hasText(this.appliedZoneName())) {
      return `No encontramos negocios en ${this.appliedZoneName()}`;
    }

    return 'No hay negocios disponibles ahora';
  }

  emptyStateMessage(): string {
    if (hasText(this.appliedZoneName())) {
      return 'Prueba con otra zona o limpia el filtro para ver mas negocios disponibles en AppuraPe.';
    }

    return 'Vuelve a intentarlo en unos minutos. Cuando haya negocios activos, apareceran aqui con su horario y zona.';
  }

  searchEmptyMessage(): string {
    if (this.errorMessage()) {
      return 'Intenta nuevamente o limpia la busqueda para volver al listado normal de negocios.';
    }

    return 'Prueba con otro plato, una categoria, un negocio o limpia la busqueda para volver al listado normal.';
  }

  private syncFormWithQueryParams(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          q: this.normalizeFilterValue(params.get('q')),
          zoneId: this.normalizeFilterValue(params.get('zoneId')),
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.q === current.q && previous.zoneId === current.zoneId,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filters) => {
        if (
          this.searchForm.controls.q.getRawValue() === filters.q &&
          this.searchForm.controls.zoneId.getRawValue() === filters.zoneId
        ) {
          return;
        }

        this.searchForm.setValue(filters, { emitEvent: false });
      });
  }

  private bindQueryParamsToResults(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          q: this.normalizeFilterValue(params.get('q')),
          zoneId: this.normalizeFilterValue(params.get('zoneId')),
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.q === current.q && previous.zoneId === current.zoneId,
        ),
        tap((filters) => {
          this.appliedQuery.set(filters.q);
          this.appliedZoneId.set(filters.zoneId);
          this.errorMessage.set('');
          this.isLoading.set(true);
        }),
        switchMap((filters) => {
          const requestId = ++this.latestRequestId;
          const request$ = filters.q
            ? this.businessesApi.searchPublic(filters.q).pipe(
                map(
                  (searchResults): RestaurantListViewState => ({
                    mode: 'search',
                    searchResults,
                  }),
                ),
                catchError((error) => {
                  const message = getApiErrorMessage(error, 'Revisa tu conexion o intenta nuevamente.');
                  this.errorMessage.set(message);
                  this.notificationService.error(message);
                  return of<RestaurantListViewState>({
                    mode: 'search',
                    searchResults: this.emptySearchResults(filters.q),
                  });
                }),
              )
            : this.businessesApi.getBusinesses(undefined, filters.zoneId || undefined).pipe(
                map(
                  (restaurants): RestaurantListViewState => ({
                    mode: 'browse',
                    restaurants,
                  }),
                ),
                catchError((error) => {
                  const message = getApiErrorMessage(error, 'Revisa tu conexion o intenta nuevamente.');
                  this.errorMessage.set(message);
                  this.notificationService.error(message);
                  return of<RestaurantListViewState>({
                    mode: 'browse',
                    restaurants: [],
                  });
                }),
              );

          return request$.pipe(
            finalize(() => {
              if (this.latestRequestId === requestId) {
                this.isLoading.set(false);
              }
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => {
        if (state.mode === 'search') {
          this.searchResults.set(state.searchResults);
          this.restaurants.set([]);
          return;
        }

        this.restaurants.set(state.restaurants);
        this.searchResults.set(null);
      });
  }

  private bindFormToQueryParams(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(350),
        map((filters) => ({
          q: this.normalizeFilterValue(filters.q),
          zoneId: this.normalizeFilterValue(filters.zoneId),
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.q === current.q && previous.zoneId === current.zoneId,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filters) => {
        if (filters.q === this.appliedQuery() && filters.zoneId === this.appliedZoneId()) {
          return;
        }

        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            q: filters.q || null,
            zoneId: filters.zoneId || null,
          },
          replaceUrl: true,
        });
      });
  }

  private loadZones(): void {
    this.zonesApi
      .getZones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (zones) => {
          this.zones.set(zones);
          this.isLoadingZones.set(false);
        },
        error: (error) => {
          const message = getApiErrorMessage(error, 'No pudimos cargar las zonas, pero puedes buscar por comida o negocio.');
          this.zonesErrorMessage.set(message);
          this.notificationService.warning(message);
          this.isLoadingZones.set(false);
        },
      });
  }

  private emptySearchResults(query: string): PublicBusinessSearchResponse {
    return {
      query,
      foods: [],
      restaurants: [],
    };
  }

  private normalizeFilterValue(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }

  private buildHeroBackgroundImageUrl(): string {
    const baseUrl = environment.storagePublicBaseUrl.trim();

    if (!baseUrl) {
      return '/img/banner1.png';
    }

    return `${baseUrl.replace(/\/$/, '')}/2026/banner1.png`;
  }
}


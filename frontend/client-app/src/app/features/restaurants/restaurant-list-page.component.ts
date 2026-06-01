import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, map, of, switchMap, tap } from 'rxjs';
import {
  PublicSearchResponse,
  RestaurantListItemResponse,
  ZoneListItemResponse,
} from '../../core/models/restaurants.models';
import { RestaurantsApiService } from '../../core/services/restaurants-api.service';
import { ZonesApiService } from '../../core/services/zones-api.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';

type BrowseResultsState = {
  mode: 'browse';
  restaurants: RestaurantListItemResponse[];
};

type SearchResultsState = {
  mode: 'search';
  searchResults: PublicSearchResponse;
};

type RestaurantListViewState = BrowseResultsState | SearchResultsState;

@Component({
  selector: 'app-restaurant-list-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './restaurant-list-page.component.html',
})
export class RestaurantListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly zonesApi = inject(ZonesApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private latestRequestId = 0;

  readonly restaurants = signal<RestaurantListItemResponse[]>([]);
  readonly searchResults = signal<PublicSearchResponse | null>(null);
  readonly zones = signal<ZoneListItemResponse[]>([]);
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
    const label = count === 1 ? '1 restaurante disponible' : `${count} restaurantes disponibles`;

    if (hasText(this.appliedZoneName())) {
      return `${label} en ${this.appliedZoneName()}.`;
    }

    return `${label} para explorar ahora.`;
  });
  readonly searchSummary = computed(() => {
    const foods = this.foods().length;
    const restaurants = this.relatedRestaurants().length;
    const foodsLabel = foods === 1 ? '1 comida' : `${foods} comidas`;
    const restaurantsLabel = restaurants === 1 ? '1 restaurante' : `${restaurants} restaurantes`;

    return `${foodsLabel} y ${restaurantsLabel} relacionados encontrados.`;
  });

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

  hasZone(restaurant: RestaurantListItemResponse): boolean {
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
      return `No encontramos restaurantes en ${this.appliedZoneName()}`;
    }

    return 'No hay restaurantes disponibles ahora';
  }

  emptyStateMessage(): string {
    if (hasText(this.appliedZoneName())) {
      return 'Prueba con otra zona o limpia el filtro para ver mas restaurantes disponibles en AppuraPe.';
    }

    return 'Vuelve a intentarlo en unos minutos. Cuando haya restaurantes activos, apareceran aqui con su horario y zona.';
  }

  searchEmptyMessage(): string {
    if (this.errorMessage()) {
      return 'Intenta nuevamente o limpia la busqueda para volver al listado normal de restaurantes.';
    }

    return 'Prueba con otro plato, una categoria, un restaurante o limpia la busqueda para volver al listado normal.';
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
            ? this.restaurantsApi.searchPublic(filters.q).pipe(
                map(
                  (searchResults): RestaurantListViewState => ({
                    mode: 'search',
                    searchResults,
                  }),
                ),
                catchError((error) => {
                  this.errorMessage.set(getApiErrorMessage(error, 'Revisa tu conexion o intenta nuevamente.'));
                  return of<RestaurantListViewState>({
                    mode: 'search',
                    searchResults: this.emptySearchResults(filters.q),
                  });
                }),
              )
            : this.restaurantsApi.getRestaurants(undefined, filters.zoneId || undefined).pipe(
                map(
                  (restaurants): RestaurantListViewState => ({
                    mode: 'browse',
                    restaurants,
                  }),
                ),
                catchError((error) => {
                  this.errorMessage.set(getApiErrorMessage(error, 'Revisa tu conexion o intenta nuevamente.'));
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
          this.zonesErrorMessage.set(
            getApiErrorMessage(error, 'No pudimos cargar las zonas, pero puedes buscar por comida o restaurante.'),
          );
          this.isLoadingZones.set(false);
        },
      });
  }

  private emptySearchResults(query: string): PublicSearchResponse {
    return {
      query,
      foods: [],
      restaurants: [],
    };
  }

  private normalizeFilterValue(value: string | null | undefined): string {
    return value?.trim() ?? '';
  }
}

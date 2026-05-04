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
import { PageHeaderComponent } from '../../shared/components/page-header.component';

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
  imports: [RouterLink, ReactiveFormsModule, PageHeaderComponent, CurrencyPipe],
  template: `
    <section class="page-shell main-stack">
      <div class="hero-card">
        <app-page-header
          eyebrow="Descubre"
          title="Busca primero lo que quieres comer"
          subtitle="Encuentra platos, comidas y restaurantes relacionados en AppuraPe. Si aun no decides, explora restaurantes por zona."
        />
        <div class="hero-actions">
          <span class="badge success">Busqueda global</span>
          <span class="badge">Comidas primero</span>
          <span class="badge">Filtro por zona</span>
        </div>
      </div>

      <section class="app-card filter-panel">
        <div class="section-heading">
          <div>
            <h2>Encuentra tu proximo pedido</h2>
            <p class="muted">
              @if (isSearchMode()) {
                Resultados globales por comida o restaurante.
              } @else {
                Explora restaurantes y usa zona cuando aun no tienes un plato en mente.
              }
            </p>
          </div>
          <button class="button subtle" type="button" (click)="clearFilters()" [disabled]="!hasActiveFilters()">
            Limpiar filtros
          </button>
        </div>

        <form class="filters-grid" [formGroup]="searchForm">
          <div class="field search-field">
            <label for="restaurantSearch">Buscar comida o restaurante</label>
            <input
              id="restaurantSearch"
              type="search"
              formControlName="q"
              placeholder="Busca lo que quieres comer"
              autocomplete="off"
            />
            <span class="field-hint">
              @if (isSearchMode()) {
                Mostramos primero comidas encontradas y despues restaurantes relacionados.
              } @else {
                Si escribes un plato o comida, el buscador principal cambiara a resultados globales.
              }
            </span>
          </div>

          <div class="field">
            <label for="restaurantZone">Zona</label>
            <select
              id="restaurantZone"
              formControlName="zoneId"
              [disabled]="isSearchMode() || (isLoadingZones() && !zones().length)"
            >
              <option value="">Todas las zonas</option>
              @for (zone of zones(); track zone.id) {
                <option [value]="zone.id">{{ zone.name }}</option>
              }
            </select>
            <span class="field-hint">
              @if (isSearchMode()) {
                La zona se aplica cuando el buscador principal esta vacio.
              } @else if (isLoadingZones()) {
                Cargando zonas disponibles...
              } @else {
                Filtra restaurantes por la zona donde quieres pedir.
              }
            </span>
          </div>
        </form>

        @if (zonesErrorMessage()) {
          <div class="alert info">
            <strong class="alert-title">Seguimos mostrando resultados</strong>
            <span>{{ zonesErrorMessage() }}</span>
          </div>
        }
      </section>

      @if (errorMessage()) {
        <div class="alert error">
          <strong class="alert-title">No pudimos actualizar la busqueda</strong>
          <span>{{ errorMessage() }}</span>
        </div>
      }

      @if (isLoading()) {
        <div class="app-card loading-state">
          <span class="eyebrow">{{ isSearchMode() ? 'Buscando' : 'Cargando' }}</span>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
        </div>
      } @else if (isSearchMode()) {
        @if (!foods().length && !relatedRestaurants().length) {
          <div class="empty-state">
            <div class="empty-state-icon">Q</div>
            <h2>No encontramos comidas o restaurantes con ese nombre</h2>
            <p class="muted">{{ searchEmptyMessage() }}</p>
            <button class="button" type="button" (click)="clearSearch()">Quitar busqueda</button>
          </div>
        } @else {
          <div class="section-heading">
            <div>
              <h2>Resultados para "{{ appliedQuery() }}"</h2>
              <p class="muted">{{ searchSummary() }}</p>
            </div>
            <span class="badge success">Busqueda global</span>
          </div>

          <section class="result-section">
            <div class="section-heading">
              <div>
                <h2>Comidas encontradas</h2>
                <p class="muted">Los platos aparecen primero para ayudarte a decidir mas rapido.</p>
              </div>
              <span class="badge info">{{ foods().length }}</span>
            </div>

            @if (!foods().length) {
              <div class="alert info">
                <strong class="alert-title">Sin coincidencias en platos</strong>
                <span>No encontramos comidas para "{{ appliedQuery() }}", pero aun puedes revisar restaurantes relacionados abajo.</span>
              </div>
            } @else {
              <div class="result-grid">
                @for (food of foods(); track food.menuItemId) {
                  <article class="app-card food-result-card">
                    <div class="food-result-card__top">
                      <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <div class="restaurant-avatar">{{ getInitial(food.name) }}</div>
                        <div>
                          @if (hasText(food.categoryName)) {
                            <span class="eyebrow">{{ food.categoryName }}</span>
                          }
                          <h2 style="margin-top: 0.65rem;">{{ food.name }}</h2>
                          <p class="muted">{{ food.description || 'Disponible para pedir en AppuraPe.' }}</p>
                        </div>
                      </div>
                      <strong class="price">{{ food.price | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                    </div>

                    <div class="meta-grid">
                      <div class="meta-item">
                        <span>Restaurante</span>
                        <strong>{{ food.restaurantName }}</strong>
                      </div>
                      @if (hasText(food.zoneName)) {
                        <div class="meta-item">
                          <span>Zona</span>
                          <strong>{{ food.zoneName }}</strong>
                        </div>
                      }
                      @if (hasText(food.categoryName)) {
                        <div class="meta-item">
                          <span>Categoria</span>
                          <strong>{{ food.categoryName }}</strong>
                        </div>
                      }
                    </div>

                    <div class="button-row" style="margin-top: auto;">
                      <a
                        class="button full primary-action"
                        [routerLink]="['/restaurants', food.restaurantId]"
                        [queryParams]="{
                          menuSearch: appliedQuery(),
                          searchSource: 'global',
                          matchedItemId: food.menuItemId,
                          matchedCategoryName: food.categoryName || null
                        }"
                      >
                        Ver restaurante y menu
                      </a>
                    </div>
                  </article>
                }
              </div>
            }
          </section>

          <section class="result-section">
            <div class="section-heading">
              <div>
                <h2>Restaurantes relacionados</h2>
                <p class="muted">Tambien puedes entrar directo al restaurante si ya sabes donde pedir.</p>
              </div>
              <span class="badge">{{ relatedRestaurants().length }}</span>
            </div>

            @if (!relatedRestaurants().length) {
              <div class="alert info">
                <strong class="alert-title">Sin restaurantes relacionados</strong>
                <span>No encontramos restaurantes adicionales para esa busqueda.</span>
              </div>
            } @else {
              <div class="grid cards">
                @for (restaurant of relatedRestaurants(); track restaurant.restaurantId) {
                  <article class="app-card restaurant-card">
                    <div class="restaurant-card-top">
                      <div style="display: flex; gap: 1rem; align-items: flex-start;">
                        <div class="restaurant-avatar">{{ getInitial(restaurant.name) }}</div>
                        <div>
                          @if (hasText(restaurant.zoneName)) {
                            <span class="eyebrow">{{ restaurant.zoneName }}</span>
                          }
                          <h2 style="margin-top: 0.65rem;">{{ restaurant.name }}</h2>
                          <p class="muted">{{ restaurant.description || 'Restaurante disponible para pedidos en AppuraPe.' }}</p>
                        </div>
                      </div>
                    </div>

                    <div class="meta-grid">
                      @if (hasText(restaurant.zoneName)) {
                        <div class="meta-item">
                          <span>Zona</span>
                          <strong>{{ restaurant.zoneName }}</strong>
                        </div>
                      }
                      <div class="meta-item">
                        <span>Horario</span>
                        <strong>{{ formatSchedule(restaurant.openTime, restaurant.closeTime) }}</strong>
                      </div>
                    </div>

                    <div class="button-row" style="margin-top: auto;">
                      <a class="button full primary-action" [routerLink]="['/restaurants', restaurant.restaurantId]">
                        Ver detalle
                      </a>
                    </div>
                  </article>
                }
              </div>
            }
          </section>
        }
      } @else if (!restaurants().length && !errorMessage()) {
        <div class="empty-state">
          <div class="empty-state-icon">A</div>
          <h2>{{ emptyStateTitle() }}</h2>
          <p class="muted">{{ emptyStateMessage() }}</p>
          @if (hasActiveFilters()) {
            <button class="button" type="button" (click)="clearFilters()">Quitar filtros y ver todos</button>
          }
        </div>
      } @else {
        <div class="section-heading">
          <div>
            <h2>Restaurantes disponibles</h2>
            <p class="muted">{{ browseSummary() }}</p>
          </div>
          @if (hasZoneFilter()) {
            <span class="badge info">Zona aplicada</span>
          }
        </div>

        <div class="grid cards">
          @for (restaurant of restaurants(); track restaurant.id) {
            <article class="app-card restaurant-card">
              <div class="restaurant-card-top">
                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                  <div class="restaurant-avatar">{{ getInitial(restaurant.name) }}</div>
                  <div>
                    @if (hasZone(restaurant)) {
                      <span class="eyebrow">{{ restaurant.zoneName }}</span>
                    }
                    <h2 style="margin-top: 0.65rem;">{{ restaurant.name }}</h2>
                    <p class="muted">{{ restaurant.description || 'Restaurante disponible para pedidos en AppuraPe.' }}</p>
                  </div>
                </div>
                <span class="badge" [class.success]="restaurant.isOpenNow" [class.warning]="!restaurant.isOpenNow">
                  {{ restaurant.isOpenNow ? 'Abierto' : 'Cerrado' }}
                </span>
              </div>

              <div class="meta-grid">
                @if (hasZone(restaurant)) {
                  <div class="meta-item">
                    <span>Zona</span>
                    <strong>{{ restaurant.zoneName }}</strong>
                  </div>
                }
                <div class="meta-item">
                  <span>Horario</span>
                  <strong>{{ formatSchedule(restaurant.openTime, restaurant.closeTime) }}</strong>
                </div>
              </div>

              @if (hasText(restaurant.reference)) {
                <div class="alert info">
                  <strong class="alert-title">Referencia</strong>
                  <span>{{ restaurant.reference }}</span>
                </div>
              }

              <div class="button-row" style="margin-top: auto;">
                <a class="button full primary-action" [routerLink]="['/restaurants', restaurant.id]">Ver menu y pedir</a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
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

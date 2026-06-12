import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ArrowRight, ChevronDown, ChevronRight, Clock3, Flame, LucideAngularModule, MapPin, Sparkles } from 'lucide-angular';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, finalize, fromEvent, map, of, startWith, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BusinessBrowseFilters,
  BusinessCategorySectionResponse,
  BusinessListItemResponse,
  BusinessTypeListItemResponse,
  BusinessZoneListItemResponse,
  PublicBusinessMobileHomeResponse,
  PublicBusinessSearchResponse,
} from '../../core/models/businesses.models';
import { BusinessesApiService } from '../../core/services/businesses-api.service';
import { ZonesApiService } from '../../core/services/zones-api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { BusinessesFiltersCardComponent } from './businesses-filters-card.component';
import { BusinessesBusinessCardComponent } from './businesses-business-card.component';
import { BusinessesHeroSectionComponent } from './businesses-hero-section.component';
import { BusinessesPageContainerComponent } from './businesses-page-container.component';
import { MenuCardComponent } from '../restaurants/components/menu-card.component';
import { SectionHeaderComponent } from '../restaurants/components/section-header.component';
import { StateCardComponent } from '../restaurants/components/state-card.component';
import { MobileExploreHeaderComponent } from './mobile-explore-header.component';
import { BusinessFilterSheetComponent } from './business-filter-sheet.component';
import { PopularCategoryCarouselComponent } from './popular-category-carousel.component';
import { BusinessCategorySectionComponent } from './business-category-section.component';
import { FilteredBusinessListComponent } from './filtered-business-list.component';

type QueryFilters = {
  q: string;
  zoneId: string;
  businessTypeId: string;
  openNow: boolean;
  sort: '' | 'alphabetical' | 'recent' | 'popular';
};

type ViewportMode = 'mobile' | 'desktop';

type RestaurantListViewState =
  | { mode: 'mobile-home'; home: PublicBusinessMobileHomeResponse }
  | { mode: 'browse'; restaurants: BusinessListItemResponse[] }
  | { mode: 'search'; searchResults: PublicBusinessSearchResponse }
  | { mode: 'filtered'; restaurants: BusinessListItemResponse[] };

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
    MobileExploreHeaderComponent,
    BusinessFilterSheetComponent,
    PopularCategoryCarouselComponent,
    BusinessCategorySectionComponent,
    FilteredBusinessListComponent,
  ],
  templateUrl: './business-list-page.component.html',
})
export class BusinessListPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly businessesApi = inject(BusinessesApiService);
  private readonly zonesApi = inject(ZonesApiService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private latestRequestId = 0;

  readonly restaurants = signal<BusinessListItemResponse[]>([]);
  readonly searchResults = signal<PublicBusinessSearchResponse | null>(null);
  readonly mobileHome = signal<PublicBusinessMobileHomeResponse | null>(null);
  readonly zones = signal<BusinessZoneListItemResponse[]>([]);
  readonly businessTypes = signal<BusinessTypeListItemResponse[]>([]);
  readonly viewportMode = signal<ViewportMode>('desktop');
  readonly isFilterSheetOpen = signal(false);
  readonly isLoading = signal(true);
  readonly isLoadingZones = signal(true);
  readonly isLoadingBusinessTypes = signal(true);
  readonly errorMessage = signal('');
  readonly zonesErrorMessage = signal('');
  readonly businessTypesErrorMessage = signal('');
  readonly appliedQuery = signal('');
  readonly appliedZoneId = signal('');
  readonly appliedBusinessTypeId = signal('');
  readonly appliedOpenNow = signal(false);
  readonly appliedSort = signal<QueryFilters['sort']>('');
  readonly hasText = hasText;

  readonly searchForm = this.formBuilder.nonNullable.group({
    q: '',
    zoneId: '',
    businessTypeId: '',
    openNow: false,
    sort: '' as QueryFilters['sort'],
  });

  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly hasStructuredFilters = computed(
    () =>
      hasText(this.appliedZoneId()) ||
      hasText(this.appliedBusinessTypeId()) ||
      this.appliedOpenNow() ||
      hasText(this.appliedSort()),
  );
  readonly hasActiveFilters = computed(() => hasText(this.appliedQuery()) || this.hasStructuredFilters());
  readonly isDesktopSearchResults = computed(
    () => this.viewportMode() === 'desktop' && hasText(this.appliedQuery()) && !this.hasStructuredFilters(),
  );
  readonly showMobileHome = computed(() => this.viewportMode() === 'mobile' && !this.hasActiveFilters());
  readonly showFilteredList = computed(() => this.viewportMode() === 'mobile' && this.hasActiveFilters());
  readonly foods = computed(() => this.searchResults()?.foods ?? []);
  readonly relatedRestaurants = computed(() => this.searchResults()?.restaurants ?? []);
  readonly popularCategories = computed(() => this.mobileHome()?.popularCategories ?? []);
  readonly homeSections = computed(() => this.mobileHome()?.sections ?? []);
  readonly appliedZoneName = computed(
    () => this.zones().find((zone) => zone.id === this.appliedZoneId())?.name ?? '',
  );
  readonly mobileLocationLabel = computed(() =>
    hasText(this.appliedZoneName()) ? `${this.appliedZoneName()}, Iquitos` : 'Todas las zonas',
  );
  readonly appliedBusinessTypeName = computed(
    () => this.businessTypes().find((type) => type.id === this.appliedBusinessTypeId())?.name ?? '',
  );
  readonly browseSummary = computed(() => {
    const count = this.restaurants().length;
    const label = count === 1 ? '1 negocio disponible' : `${count} negocios disponibles`;

    if (hasText(this.appliedBusinessTypeName()) && hasText(this.appliedZoneName())) {
      return `${label} en ${this.appliedBusinessTypeName()} · ${this.appliedZoneName()}.`;
    }

    if (hasText(this.appliedBusinessTypeName())) {
      return `${label} en ${this.appliedBusinessTypeName()}.`;
    }

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
  readonly arrowRightIcon = ArrowRight;
  readonly chevronRightIcon = ChevronRight;
  readonly chevronDownIcon = ChevronDown;
  readonly mapPinIcon = MapPin;
  readonly flameIcon = Flame;
  readonly clockIcon = Clock3;
  readonly sparklesIcon = Sparkles;

  constructor() {
    this.loadZones();
    this.loadBusinessTypes();
    this.syncFormWithQueryParams();
    this.bindQueryParamsToResults();
    this.bindFormToQueryParams();
  }

  openFilterSheet(): void {
    this.isFilterSheetOpen.set(true);
  }

  closeFilterSheet(): void {
    this.isFilterSheetOpen.set(false);
  }

  clearFilters(): void {
    this.searchForm.setValue({
      q: '',
      zoneId: '',
      businessTypeId: '',
      openNow: false,
      sort: '',
    });
  }

  clearSearch(): void {
    this.searchForm.controls.q.setValue('');
  }

  selectCategory(categoryId: string): void {
    this.searchForm.controls.businessTypeId.setValue(categoryId);
    this.closeFilterSheet();
  }

  viewAllCategory(categoryId: string): void {
    this.searchForm.controls.businessTypeId.setValue(categoryId);
  }

  toggleOpenNow(): void {
    this.searchForm.controls.openNow.setValue(!this.searchForm.controls.openNow.getRawValue());
  }

  setSort(sort: QueryFilters['sort']): void {
    const current = this.searchForm.controls.sort.getRawValue();
    this.searchForm.controls.sort.setValue(current === sort ? '' : sort);
  }

  isSortActive(sort: QueryFilters['sort']): boolean {
    return this.searchForm.controls.sort.getRawValue() === sort;
  }

  formatSchedule(openTime: string, closeTime: string): string {
    return `${formatTimeSpan(openTime)} - ${formatTimeSpan(closeTime)}`;
  }

  emptyStateTitle(): string {
    if (hasText(this.appliedBusinessTypeName())) {
      return `No encontramos negocios en ${this.appliedBusinessTypeName()}`;
    }

    if (hasText(this.appliedZoneName())) {
      return `No encontramos negocios en ${this.appliedZoneName()}`;
    }

    return 'No hay negocios disponibles ahora';
  }

  emptyStateMessage(): string {
    if (hasText(this.appliedBusinessTypeName()) || hasText(this.appliedZoneName())) {
      return 'Prueba con otra categoría, otra zona o limpia los filtros para ver más negocios disponibles.';
    }

    return 'Vuelve a intentarlo en unos minutos. Cuando haya negocios activos, aparecerán aquí con su horario y zona.';
  }

  searchEmptyMessage(): string {
    if (this.errorMessage()) {
      return 'Intenta nuevamente o limpia la búsqueda para volver al listado normal de negocios.';
    }

    return 'Prueba con otro plato, una categoría, un negocio o limpia la búsqueda para volver al listado normal.';
  }

  private syncFormWithQueryParams(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => this.mapQueryParams(params)),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filters) => {
        const currentValue = this.searchForm.getRawValue();
        if (JSON.stringify(currentValue) === JSON.stringify(filters)) {
          return;
        }

        this.searchForm.setValue(filters, { emitEvent: false });
      });
  }

  private bindQueryParamsToResults(): void {
    const queryFilters$ = this.route.queryParamMap.pipe(
      map((params) => this.mapQueryParams(params)),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
    );
    const viewportMode$ = this.createViewportModeStream();

    combineLatest([queryFilters$, viewportMode$])
      .pipe(
        tap(([filters, viewport]) => {
          this.viewportMode.set(viewport);
          this.appliedQuery.set(filters.q);
          this.appliedZoneId.set(filters.zoneId);
          this.appliedBusinessTypeId.set(filters.businessTypeId);
          this.appliedOpenNow.set(filters.openNow);
          this.appliedSort.set(filters.sort);
          this.errorMessage.set('');
          this.isLoading.set(true);
        }),
        switchMap(([filters, viewport]) => {
          const requestId = ++this.latestRequestId;
          const request$ = this.selectViewRequest(filters, viewport);

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
        this.restaurants.set([]);
        this.searchResults.set(null);
        this.mobileHome.set(null);

        switch (state.mode) {
          case 'mobile-home':
            this.mobileHome.set(state.home);
            break;
          case 'search':
            this.searchResults.set(state.searchResults);
            break;
          case 'browse':
          case 'filtered':
            this.restaurants.set(state.restaurants);
            break;
        }
      });
  }

  private bindFormToQueryParams(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(350),
        map((filters) => ({
          q: this.normalizeFilterValue(filters.q),
          zoneId: this.normalizeFilterValue(filters.zoneId),
          businessTypeId: this.normalizeFilterValue(filters.businessTypeId),
          openNow: !!filters.openNow,
          sort: (this.normalizeFilterValue(filters.sort) as QueryFilters['sort']) || '',
        })),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((filters) => {
        if (
          filters.q === this.appliedQuery() &&
          filters.zoneId === this.appliedZoneId() &&
          filters.businessTypeId === this.appliedBusinessTypeId() &&
          filters.openNow === this.appliedOpenNow() &&
          filters.sort === this.appliedSort()
        ) {
          return;
        }

        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            q: filters.q || null,
            zoneId: filters.zoneId || null,
            businessTypeId: filters.businessTypeId || null,
            openNow: filters.openNow ? true : null,
            sort: filters.sort || null,
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
          const message = getApiErrorMessage(error, 'No pudimos cargar las zonas, pero puedes buscar por negocio.');
          this.zonesErrorMessage.set(message);
          this.notificationService.warning(message);
          this.isLoadingZones.set(false);
        },
      });
  }

  private loadBusinessTypes(): void {
    this.businessesApi
      .getBusinessTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (businessTypes) => {
          this.businessTypes.set(businessTypes);
          this.isLoadingBusinessTypes.set(false);
        },
        error: (error) => {
          const message = getApiErrorMessage(error, 'No pudimos cargar las categorías por ahora.');
          this.businessTypesErrorMessage.set(message);
          this.notificationService.warning(message);
          this.isLoadingBusinessTypes.set(false);
        },
      });
  }

  private selectViewRequest(filters: QueryFilters, viewport: ViewportMode) {
    const requestFilters = this.toBusinessBrowseFilters(filters);
    const hasStructuredFilters =
      hasText(filters.zoneId) || hasText(filters.businessTypeId) || filters.openNow || hasText(filters.sort);

    if (viewport === 'mobile' && !this.hasAnyFilter(filters)) {
      return this.businessesApi.getMobileHome().pipe(
        map((home): RestaurantListViewState => ({ mode: 'mobile-home', home })),
        catchError((error) => {
          const message = getApiErrorMessage(error, 'No pudimos cargar la portada móvil de negocios.');
          this.errorMessage.set(message);
          this.notificationService.error(message);
          return of<RestaurantListViewState>({
            mode: 'mobile-home',
            home: {
              categories: [],
              popularCategories: [],
              sections: [],
            },
          });
        }),
      );
    }

    if (viewport === 'desktop' && hasText(filters.q) && !hasStructuredFilters) {
      return this.businessesApi.searchPublic(filters.q).pipe(
        map((searchResults): RestaurantListViewState => ({ mode: 'search', searchResults })),
        catchError((error) => {
          const message = getApiErrorMessage(error, 'Revisa tu conexión o intenta nuevamente.');
          this.errorMessage.set(message);
          this.notificationService.error(message);
          return of<RestaurantListViewState>({
            mode: 'search',
            searchResults: this.emptySearchResults(filters.q),
          });
        }),
      );
    }

    return this.businessesApi.getBusinesses(requestFilters).pipe(
      map(
        (restaurants): RestaurantListViewState => ({
          mode: this.hasAnyFilter(filters) ? 'filtered' : 'browse',
          restaurants,
        }),
      ),
      catchError((error) => {
        const message = getApiErrorMessage(error, 'Revisa tu conexión o intenta nuevamente.');
        this.errorMessage.set(message);
        this.notificationService.error(message);
        return of<RestaurantListViewState>({
          mode: this.hasAnyFilter(filters) ? 'filtered' : 'browse',
          restaurants: [],
        });
      }),
    );
  }

  private createViewportModeStream() {
    if (typeof window === 'undefined') {
      return of<ViewportMode>('desktop');
    }

    return fromEvent(window, 'resize').pipe(
      startWith(null),
      map(() => (window.innerWidth >= 1024 ? 'desktop' : 'mobile')),
      distinctUntilChanged(),
    );
  }

  private emptySearchResults(query: string): PublicBusinessSearchResponse {
    return {
      query,
      foods: [],
      restaurants: [],
    };
  }

  private mapQueryParams(params: { get(name: string): string | null }): QueryFilters {
    const sortValue = this.normalizeFilterValue(params.get('sort'));

    return {
      q: this.normalizeFilterValue(params.get('q')),
      zoneId: this.normalizeFilterValue(params.get('zoneId')),
      businessTypeId: this.normalizeFilterValue(params.get('businessTypeId')),
      openNow: params.get('openNow') === 'true',
      sort: this.isSortOption(sortValue) ? sortValue : '',
    };
  }

  private toBusinessBrowseFilters(filters: QueryFilters): BusinessBrowseFilters {
    return {
      q: filters.q || undefined,
      zoneId: filters.zoneId || undefined,
      businessTypeId: filters.businessTypeId || undefined,
      openNow: filters.openNow || undefined,
      sort: filters.sort || undefined,
      page: 1,
      pageSize: 24,
    };
  }

  private hasAnyFilter(filters: QueryFilters): boolean {
    return hasText(filters.q) || hasText(filters.zoneId) || hasText(filters.businessTypeId) || filters.openNow || hasText(filters.sort);
  }

  private isSortOption(value: string): value is QueryFilters['sort'] {
    return value === '' || value === 'alphabetical' || value === 'recent' || value === 'popular';
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

import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
import { CreateOrderRequest, PaymentMethod } from '../../core/models/orders.models';
import {
  MenuItemResponse,
  PublicMenuCategoryResponse,
  PublicMenuResponse,
  RestaurantDetailResponse,
} from '../../core/models/restaurants.models';
import { AuthService } from '../../core/services/auth.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { RestaurantsApiService } from '../../core/services/restaurants-api.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';

type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type HighlightSegment = {
  text: string;
  isMatch: boolean;
};

@Component({
  selector: 'app-restaurant-detail-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './restaurant-detail-page.component.html',
})
export class RestaurantDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly paymentMethods: PaymentMethod[] = ['Cash', 'Yape', 'Plin', 'Card'];
  readonly restaurant = signal<RestaurantDetailResponse | null>(null);
  readonly menu = signal<PublicMenuResponse | null>(null);
  readonly cartState = signal<Record<string, CartLine>>({});
  readonly isLoading = signal(true);
  readonly isSubmittingOrder = signal(false);
  readonly errorMessage = signal('');
  readonly checkoutErrorMessage = signal('');
  readonly recentlyAddedMessage = signal('');
  readonly menuSearchQuery = signal('');
  readonly searchSource = signal('');
  readonly matchedItemId = signal('');
  readonly matchedCategoryName = signal('');
  readonly globalContextQuery = signal('');
  readonly selectedCategoryId = signal<'all' | string>('all');
  readonly isCheckoutDrawerOpen = signal(false);
  readonly hasText = hasText;
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly menuSearchControl = new FormControl('', { nonNullable: true });

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    deliveryAddress: ['', [Validators.required, Validators.maxLength(300)]],
    deliveryReference: ['', [Validators.required, Validators.maxLength(300)]],
    notes: ['', [Validators.maxLength(1000)]],
    paymentMethod: ['Cash' as PaymentMethod, [Validators.required]],
  });

  readonly cartItems = computed(() =>
    Object.values(this.cartState()).sort((left, right) => left.name.localeCompare(right.name)),
  );
  readonly totalQuantity = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.price * item.quantity, 0),
  );
  readonly hasActiveMenuSearch = computed(() => hasText(this.menuSearchQuery()));
  readonly isGlobalSearchContext = computed(
    () => this.searchSource() === 'global' && this.hasActiveMenuSearch(),
  );
  readonly visibleMenu = computed(() => {
    const menu = this.menu();

    if (!menu) {
      return null;
    }

    const query = this.normalizeMenuMatchValue(this.menuSearchQuery());

    if (!query) {
      return menu;
    }

    const categories = menu.categories
      .map((category) => this.filterCategory(category, query))
      .filter((category): category is PublicMenuCategoryResponse => category !== null);

    return {
      ...menu,
      categories,
    };
  });
  readonly visibleCategoryCount = computed(() => this.visibleMenu()?.categories.length ?? 0);
  readonly visibleItemCount = computed(
    () => this.visibleMenu()?.categories.reduce((total, category) => total + category.items.length, 0) ?? 0,
  );
  readonly filteredVisibleCategories = computed(() => {
    const categories = this.visibleMenu()?.categories ?? [];
    const selectedCategoryId = this.selectedCategoryId();

    if (selectedCategoryId === 'all') {
      return categories;
    }

    return categories.filter((category) => category.id === selectedCategoryId);
  });
  readonly filteredVisibleCategoryCount = computed(() => this.filteredVisibleCategories().length);
  readonly filteredVisibleItemCount = computed(
    () => this.filteredVisibleCategories().reduce((total, category) => total + category.items.length, 0),
  );
  readonly groupedItemsForAllCategories = computed(() => {
    if (this.selectedCategoryId() !== 'all') {
      return [];
    }

    return this.filteredVisibleCategories().flatMap((category) => category.items);
  });
  readonly submitDisabled = computed(() => this.isSubmittingOrder() || !this.cartItems().length);
  readonly submitButtonLabel = computed(() => {
    if (this.isSubmittingOrder()) {
      return 'Enviando pedido...';
    }

    return this.isAuthenticated() ? 'Crear pedido' : 'Iniciar sesion para pedir';
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

    this.route.queryParamMap
      .pipe(
        map((params) => ({
          menuSearch: params.get('menuSearch')?.trim() ?? '',
          searchSource: params.get('searchSource')?.trim() ?? '',
          matchedItemId: params.get('matchedItemId')?.trim() ?? '',
          matchedCategoryName: params.get('matchedCategoryName')?.trim() ?? '',
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.menuSearch === current.menuSearch &&
            previous.searchSource === current.searchSource &&
            previous.matchedItemId === current.matchedItemId &&
            previous.matchedCategoryName === current.matchedCategoryName,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((params) => {
        this.menuSearchQuery.set(params.menuSearch);
        this.searchSource.set(params.searchSource);
        this.matchedItemId.set(params.matchedItemId);
        this.matchedCategoryName.set(params.matchedCategoryName);
        this.globalContextQuery.set(params.searchSource === 'global' ? params.menuSearch : '');

        if (this.menuSearchControl.getRawValue() !== params.menuSearch) {
          this.menuSearchControl.setValue(params.menuSearch, { emitEvent: false });
        }
      });

    this.menuSearchControl.valueChanges
      .pipe(
        debounceTime(250),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.menuSearchQuery.set(value);

        if (value === this.route.snapshot.queryParamMap.get('menuSearch')?.trim()) {
          return;
        }

        const shouldKeepGlobalContext = this.searchSource() === 'global' && this.globalContextQuery() === value;

        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {
            menuSearch: value || null,
            searchSource: value ? this.searchSource() || null : null,
            matchedItemId: shouldKeepGlobalContext ? this.matchedItemId() || null : null,
            matchedCategoryName: shouldKeepGlobalContext ? this.matchedCategoryName() || null : null,
          },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      });

    if (!id) {
      this.errorMessage.set('No se encontro el restaurante solicitado.');
      this.isLoading.set(false);
      return;
    }

    forkJoin({
      restaurant: this.restaurantsApi.getRestaurant(id),
      menu: this.restaurantsApi.getRestaurantMenu(id),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ restaurant, menu }) => {
          this.restaurant.set(restaurant);
          this.menu.set(menu);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(getApiErrorMessage(error, 'Revisa tu conexion o vuelve al listado para intentarlo otra vez.'));
          this.isLoading.set(false);
        },
      });
  }

  addItem(item: MenuItemResponse): void {
    if (!item.isAvailable) {
      return;
    }

    this.checkoutErrorMessage.set('');
    this.recentlyAddedMessage.set(`${item.name} se agrego a tu pedido.`);
    this.cartState.update((currentState) => {
      const currentLine = currentState[item.id];
      const quantity = currentLine ? currentLine.quantity + 1 : 1;

      return {
        ...currentState,
        [item.id]: {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity,
        },
      };
    });
  }

  incrementItem(menuItemId: string): void {
    const cartLine = this.cartState()[menuItemId];

    if (!cartLine) {
      return;
    }

    this.cartState.update((currentState) => ({
      ...currentState,
      [menuItemId]: {
        ...cartLine,
        quantity: cartLine.quantity + 1,
      },
    }));
  }

  decrementItem(menuItemId: string): void {
    const cartLine = this.cartState()[menuItemId];

    if (!cartLine) {
      return;
    }

    if (cartLine.quantity <= 1) {
      this.removeItem(menuItemId);
      return;
    }

    this.cartState.update((currentState) => ({
      ...currentState,
      [menuItemId]: {
        ...cartLine,
        quantity: cartLine.quantity - 1,
      },
    }));
  }

  removeItem(menuItemId: string): void {
    this.cartState.update((currentState) => {
      const nextState = { ...currentState };
      delete nextState[menuItemId];
      return nextState;
    });

    if (!this.cartItems().length) {
      this.recentlyAddedMessage.set('');
    }
  }

  getItemQuantity(menuItemId: string): number {
    return this.cartState()[menuItemId]?.quantity ?? 0;
  }

  clearMenuSearch(): void {
    this.menuSearchControl.setValue('');
  }

  selectCategory(categoryId: 'all' | string): void {
    this.selectedCategoryId.set(categoryId);
  }

  getCategoryPreviewImage(category: PublicMenuCategoryResponse): string {
    return category.items.find((item) => hasText(item.imageUrl))?.imageUrl ?? '/img/banner1.png';
  }

  openCheckoutDrawer(): void {
    this.isCheckoutDrawerOpen.set(true);
  }

  closeCheckoutDrawer(): void {
    this.isCheckoutDrawerOpen.set(false);
  }

  submitOrder(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (!this.cartItems().length) {
      this.checkoutErrorMessage.set('Agrega al menos un producto antes de crear el pedido.');
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.checkoutErrorMessage.set('Completa direccion, referencia y metodo de pago para continuar.');
      return;
    }

    const restaurant = this.restaurant();

    if (!restaurant?.zoneId) {
      this.checkoutErrorMessage.set('No encontramos la zona del restaurante para crear el pedido.');
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    const payload: CreateOrderRequest = {
      restaurantId: restaurant.id,
      zoneId: restaurant.zoneId,
      deliveryAddress: formValue.deliveryAddress.trim(),
      deliveryReference: formValue.deliveryReference.trim(),
      notes: formValue.notes.trim() || undefined,
      paymentMethod: formValue.paymentMethod,
      items: this.cartItems().map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
    };

    this.isSubmittingOrder.set(true);
    this.checkoutErrorMessage.set('');

    this.ordersApi
      .createOrder(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.isSubmittingOrder.set(false);
          this.cartState.set({});
          this.checkoutForm.reset({
            deliveryAddress: '',
            deliveryReference: '',
            notes: '',
            paymentMethod: 'Cash',
          });
          void this.router.navigate(['/orders', order.id], {
            queryParams: { created: '1' },
          });
        },
        error: (error) => {
          this.isSubmittingOrder.set(false);
          this.checkoutErrorMessage.set(getApiErrorMessage(error, 'Intenta nuevamente o revisa los datos del pedido.'));
        },
      });
  }

  restaurantSubtitle(): string {
    return this.restaurant()?.description || 'Revisa el menu, arma tu pedido y confirma los datos de entrega.';
  }

  formatSchedule(openTime: string, closeTime: string): string {
    return `${formatTimeSpan(openTime)} - ${formatTimeSpan(closeTime)}`;
  }

  visibleItemsSummary(): string {
    const itemCount = this.filteredVisibleItemCount();
    const categoryCount = this.filteredVisibleCategoryCount();

    if (this.hasActiveMenuSearch()) {
      if (this.isGlobalSearchContext()) {
        return `${itemCount} producto(s) en ${categoryCount} categoria(s) para "${this.menuSearchQuery()}". Llegaste desde la busqueda global.`;
      }

      return `${itemCount} producto(s) en ${categoryCount} categoria(s) para "${this.menuSearchQuery()}".`;
    }

    return 'Filtra el menu por plato, descripcion o categoria sin afectar tu carrito.';
  }

  menuEmptyStateTitle(): string {
    return this.hasActiveMenuSearch()
      ? 'No encontramos platos para esa busqueda'
      : 'Este restaurante aun no tiene menu visible';
  }

  menuEmptyStateMessage(): string {
    if (this.hasActiveMenuSearch()) {
      if (this.isGlobalSearchContext()) {
        return 'Este restaurante no tiene coincidencias visibles para esa busqueda. Limpia el filtro local o vuelve a los resultados globales.';
      }

      return 'Prueba con otro nombre de plato, una descripcion mas corta o una categoria distinta.';
    }

    return 'Cuando publique categorias e items disponibles, apareceran aqui para pedir.';
  }

  isMatchedSearchItem(menuItemId: string): boolean {
    return this.isGlobalSearchContext() && this.matchedItemId() === menuItemId;
  }

  getHighlightedSegments(value: string | null | undefined): HighlightSegment[] {
    const text = value ?? '';
    const query = this.normalizeMenuMatchValue(this.menuSearchQuery());

    if (!text.length) {
      return [{ text: '', isMatch: false }];
    }

    if (!query) {
      return [{ text, isMatch: false }];
    }

    const source = text.toLocaleLowerCase();
    const segments: HighlightSegment[] = [];
    let cursor = 0;

    while (cursor < text.length) {
      const matchIndex = source.indexOf(query, cursor);

      if (matchIndex === -1) {
        segments.push({ text: text.slice(cursor), isMatch: false });
        break;
      }

      if (matchIndex > cursor) {
        segments.push({ text: text.slice(cursor, matchIndex), isMatch: false });
      }

      segments.push({
        text: text.slice(matchIndex, matchIndex + query.length),
        isMatch: true,
      });
      cursor = matchIndex + query.length;
    }

    return segments.length ? segments : [{ text, isMatch: false }];
  }

  private filterCategory(category: PublicMenuCategoryResponse, query: string): PublicMenuCategoryResponse | null {
    const normalizedQuery = this.normalizeMenuMatchValue(query);
    const categoryMatches = this.matchesMenuText(category.name, normalizedQuery);

    if (categoryMatches) {
      return category;
    }

    const items = category.items.filter(
      (item) =>
        this.matchesMenuText(item.name, normalizedQuery) ||
        this.matchesMenuText(item.description, normalizedQuery) ||
        this.matchesMenuText(item.categoryName || category.name, normalizedQuery),
    );

    if (!items.length) {
      return null;
    }

    return {
      ...category,
      items,
    };
  }

  private matchesMenuText(value: string | null | undefined, query: string): boolean {
    return this.normalizeMenuMatchValue(value).includes(query);
  }

  private normalizeMenuMatchValue(value: string | null | undefined): string {
    return value?.trim().toLocaleLowerCase() ?? '';
  }
}


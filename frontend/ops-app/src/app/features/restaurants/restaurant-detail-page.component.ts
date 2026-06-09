import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, OnDestroy, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ShoppingCart, Trash2 } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
import { CreateOrderRequest, PaymentMethod } from '../../core/models/orders.models';
import {
  MenuItemResponse,
  PublicMenuCategoryResponse,
  PublicMenuResponse,
  RestaurantDetailResponse,
} from '../../core/models/restaurants.models';
import { AuthService } from '../../core/services/auth.service';
import { CheckoutDrawerUiService } from '../../core/services/checkout-drawer-ui.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { RestaurantsApiService } from '../../core/services/restaurants-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { MenuCardComponent } from './components/menu-card.component';

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

type FlyAnimationState = {
  x: number;
  y: number;
  toX: number;
  toY: number;
  active: boolean;
};

@Component({
  selector: 'app-restaurant-detail-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule, LucideAngularModule, AppBackButtonComponent, MenuCardComponent],
  templateUrl: './restaurant-detail-page.component.html',
})
export class RestaurantDetailPageComponent implements AfterViewInit, OnDestroy {
  private static readonly FLY_ANIMATION_DURATION_MS = 650;
  private static readonly PAYMENT_METHOD_TO_ENUM: Record<PaymentMethod, number> = {
    Cash: 0,
    Yape: 1,
    Plin: 2,
    Card: 3,
  };
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly formBuilder = inject(FormBuilder);
  private readonly restaurantsApi = inject(RestaurantsApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly notificationService = inject(NotificationService);
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
  readonly isCheckoutDrawerOpen = this.checkoutDrawerUi.isOpen;
  readonly trashIcon = Trash2;
  readonly shoppingCartIcon = ShoppingCart;
  readonly hasText = hasText;
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly menuSearchControl = new FormControl('', { nonNullable: true });
  readonly activeFlyAnimation = signal<FlyAnimationState | null>(null);
  readonly animatingAddByItemId = signal<Record<string, boolean>>({});
  @ViewChild('checkoutDrawerTemplate', { static: true })
  private checkoutDrawerTemplate?: TemplateRef<unknown>;
  private flyAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

    return this.isAuthenticated() ? 'Crear pedido' : 'Iniciar sesión para pedir';
  });

  constructor() {
    this.checkoutDrawerUi.close();
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
      const message = 'No se encontró el restaurante solicitado.';
      this.errorMessage.set(message);
      this.notificationService.error(message);
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
          this.checkoutDrawerUi.close();
          const message = getApiErrorMessage(error, 'Revisa tu conexión o vuelve al listado para intentarlo otra vez.');
          this.errorMessage.set(message);
          this.notificationService.error(message);
          this.isLoading.set(false);
        },
      });
  }

  ngAfterViewInit(): void {
    if (!this.checkoutDrawerTemplate) {
      return;
    }

    this.checkoutDrawerUi.register(this.checkoutDrawerTemplate, this);
  }

  ngOnDestroy(): void {
    if (this.flyAnimationTimeoutId !== null) {
      clearTimeout(this.flyAnimationTimeoutId);
      this.flyAnimationTimeoutId = null;
    }

    this.activeFlyAnimation.set(null);
    this.checkoutDrawerUi.unregister();
  }

  addItem(item: MenuItemResponse): void {
    if (!item.isAvailable) {
      return;
    }

    this.checkoutErrorMessage.set('');
    this.recentlyAddedMessage.set(`${item.name} se agregó a tu pedido.`);
    this.notificationService.success(`${item.name} se agregó a tu pedido.`);
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

  addItemWithAnimation(item: MenuItemResponse, event: MouseEvent): void {
    if (!item.isAvailable || this.isAnimatingAddFor(item.id)) {
      return;
    }

    this.setAnimatingAdd(item.id, true);
    this.addItem(item);

    const sourceButton = event.currentTarget as HTMLElement | null;
    if (!sourceButton) {
      this.finishAddAnimation(item.id);
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const targetButton = this.getVisibleCheckoutTarget();

        if (!targetButton) {
          this.finishAddAnimation(item.id);
          return;
        }

        const sourceRect = sourceButton.getBoundingClientRect();
        const targetRect = targetButton.getBoundingClientRect();
        const startX = sourceRect.left + sourceRect.width / 2;
        const startY = sourceRect.top + sourceRect.height / 2;
        const endX = targetRect.left + targetRect.width / 2;
        const endY = targetRect.top + targetRect.height / 2;

        this.activeFlyAnimation.set({
          x: startX,
          y: startY,
          toX: endX,
          toY: endY,
          active: false,
        });

        requestAnimationFrame(() => {
          const animation = this.activeFlyAnimation();

          if (!animation) {
            this.finishAddAnimation(item.id);
            return;
          }

          this.activeFlyAnimation.set({ ...animation, active: true });
        });

        if (this.flyAnimationTimeoutId !== null) {
          clearTimeout(this.flyAnimationTimeoutId);
        }

        this.flyAnimationTimeoutId = setTimeout(() => {
          this.flyAnimationTimeoutId = null;
          this.finishAddAnimation(item.id);
        }, RestaurantDetailPageComponent.FLY_ANIMATION_DURATION_MS);
      });
    });
  }

  isAnimatingAddFor(menuItemId: string): boolean {
    return this.animatingAddByItemId()[menuItemId] ?? false;
  }

  selectCategory(categoryId: 'all' | string): void {
    this.selectedCategoryId.set(categoryId);
  }

  getCategoryPreviewImage(category: PublicMenuCategoryResponse): string {
    return category.items.find((item) => hasText(item.imageUrl))?.imageUrl ?? '/img/banner1.png';
  }

  openCheckoutDrawer(): void {
    this.checkoutDrawerUi.open();
  }

  closeCheckoutDrawer(): void {
    this.checkoutDrawerUi.close();
  }

  submitOrder(): void {
    if (!this.isAuthenticated()) {
      this.notificationService.info('Inicia sesión para continuar con tu pedido.');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (!this.cartItems().length) {
      const message = 'Agrega al menos un producto antes de crear el pedido.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.warning(message);
      return;
    }

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      const message = 'Completa dirección, referencia y método de pago para continuar.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.warning(message);
      return;
    }

    const restaurant = this.restaurant();

    if (!restaurant?.zoneId) {
      const message = 'No encontramos la zona del restaurante para crear el pedido.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.error(message);
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    const paymentMethod = RestaurantDetailPageComponent.PAYMENT_METHOD_TO_ENUM[formValue.paymentMethod];

    const payload: CreateOrderRequest = {
      restaurantId: restaurant.id,
      zoneId: restaurant.zoneId,
      deliveryAddress: formValue.deliveryAddress.trim(),
      deliveryReference: formValue.deliveryReference.trim(),
      notes: formValue.notes.trim() || undefined,
      paymentMethod,
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
          this.checkoutDrawerUi.close();
          this.cartState.set({});
          this.checkoutForm.reset({
            deliveryAddress: '',
            deliveryReference: '',
            notes: '',
            paymentMethod: 'Cash',
          });
          this.notificationService.success('Pedido creado correctamente.');
          void this.router.navigate(['/orders', order.id], {
            queryParams: { created: '1' },
          });
        },
        error: (error) => {
          this.isSubmittingOrder.set(false);
          const message = getApiErrorMessage(error, 'Intenta nuevamente o revisa los datos del pedido.');
          this.checkoutErrorMessage.set(message);
          this.notificationService.error(message);
        },
      });
  }

  restaurantSubtitle(): string {
    return this.restaurant()?.description || 'Revisa el menú, arma tu pedido y confirma los datos de entrega.';
  }

  formatSchedule(openTime: string, closeTime: string): string {
    return `${formatTimeSpan(openTime)} - ${formatTimeSpan(closeTime)}`;
  }

  visibleItemsSummary(): string {
    const itemCount = this.filteredVisibleItemCount();
    const categoryCount = this.filteredVisibleCategoryCount();

    if (this.hasActiveMenuSearch()) {
      if (this.isGlobalSearchContext()) {
        return `${itemCount} producto(s) en ${categoryCount} categoría(s) para "${this.menuSearchQuery()}". Llegaste desde la búsqueda global.`;
      }

      return `${itemCount} producto(s) en ${categoryCount} categoría(s) para "${this.menuSearchQuery()}".`;
    }

    return 'Filtra el menú por plato, descripción o categoría sin afectar tu carrito.';
  }

  menuEmptyStateTitle(): string {
    return this.hasActiveMenuSearch()
      ? 'No encontramos platos para esa búsqueda'
      : 'Este restaurante aún no tiene menú visible';
  }

  menuEmptyStateMessage(): string {
    if (this.hasActiveMenuSearch()) {
      if (this.isGlobalSearchContext()) {
        return 'Este restaurante no tiene coincidencias visibles para esa búsqueda. Limpia el filtro local o vuelve a los resultados globales.';
      }

      return 'Prueba con otro nombre de plato, una descripción más corta o una categoría distinta.';
    }

    return 'Cuando publique categorías e items disponibles, aparecerán aquí para pedir.';
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

  private setAnimatingAdd(menuItemId: string, isAnimating: boolean): void {
    this.animatingAddByItemId.update((current) => {
      if (isAnimating) {
        return { ...current, [menuItemId]: true };
      }

      if (!current[menuItemId]) {
        return current;
      }

      const next = { ...current };
      delete next[menuItemId];
      return next;
    });
  }

  private finishAddAnimation(menuItemId: string): void {
    this.activeFlyAnimation.set(null);
    this.setAnimatingAdd(menuItemId, false);
    this.openCheckoutDrawer();
  }

  private getVisibleCheckoutTarget(): HTMLElement | null {
    const targets = Array.from(this.document.querySelectorAll<HTMLElement>('[data-checkout-target]'));

    if (!targets.length) {
      return null;
    }

    const visibleTarget =
      targets.find((target) => {
        const rect = target.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
      }) ?? targets[0];

    return visibleTarget;
  }
}


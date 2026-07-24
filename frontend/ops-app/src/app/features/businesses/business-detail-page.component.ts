import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ShoppingCart, Trash2 } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
import { CreateOrderRequest, PaymentMethod } from '../../core/models/orders.models';
import {
  BusinessDetailResponse,
  CatalogCategoryResponse,
  CatalogResponse,
} from '../../core/models/businesses.models';
import { CatalogItemResponse } from '../../core/models/catalog.models';
import { AuthService } from '../../core/services/auth.service';
import { BusinessesApiService } from '../../core/services/businesses-api.service';
import { CheckoutDrawerUiService } from '../../core/services/checkout-drawer-ui.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { MenuCardComponent } from '../restaurants/components/menu-card.component';
import { BusinessCartService } from './business-cart.service';
import { BusinessCheckoutDrawerComponent } from './business-checkout-drawer.component';

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
  selector: 'app-business-detail-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, ReactiveFormsModule, LucideAngularModule, AppBackButtonComponent, MenuCardComponent, BusinessCheckoutDrawerComponent],
  templateUrl: './business-detail-page.component.html',
})
export class BusinessDetailPageComponent implements OnDestroy {
  private static readonly FLY_ANIMATION_DURATION_MS = 650;
  private static readonly MATCH_HIGHLIGHT_DURATION_MS = 3000;
  private static readonly MATCH_SCROLL_MAX_ATTEMPTS = 10;
  private static readonly MATCH_SCROLL_RETRY_DELAY_MS = 160;
  private static readonly CATEGORY_SCROLL_MAX_ATTEMPTS = 10;
  private static readonly CATEGORY_SCROLL_RETRY_DELAY_MS = 160;
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
  private readonly businessesApi = inject(BusinessesApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly businessCart = inject(BusinessCartService);

  readonly paymentMethods: PaymentMethod[] = ['Cash', 'Yape', 'Plin', 'Card'];
  readonly catalogPlaceholderImage = '/img/catalog-placeholder.svg';
  readonly restaurant = signal<BusinessDetailResponse | null>(null);
  readonly menu = signal<CatalogResponse | null>(null);
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
  readonly businessHeroImageFailed = signal(false);
  readonly isCheckoutDrawerOpen = this.checkoutDrawerUi.isOpen;
  readonly trashIcon = Trash2;
  readonly shoppingCartIcon = ShoppingCart;
  readonly hasText = hasText;
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly menuSearchControl = new FormControl('', { nonNullable: true });
  readonly activeFlyAnimation = signal<FlyAnimationState | null>(null);
  readonly animatingAddByItemId = signal<Record<string, boolean>>({});
  readonly matchedItemBannerMessage = signal('');
  readonly highlightedMatchedItemId = signal('');
  readonly showBusinessHeroImage = computed(
    () => hasText(this.restaurant()?.logoUrl) && !this.businessHeroImageFailed(),
  );
  private flyAnimationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private highlightTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pendingMatchedItemFocusTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pendingCategoryFocusTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private handledGlobalFocusKey = '';
  private handledCategoryFocusKey = '';

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    deliveryAddress: ['', [Validators.required, Validators.maxLength(300)]],
    deliveryReference: ['', [Validators.required, Validators.maxLength(300)]],
    notes: ['', [Validators.maxLength(1000)]],
    paymentMethod: ['Cash' as PaymentMethod, [Validators.required]],
  });

  readonly cartItems = this.businessCart.cartItems;
  readonly totalQuantity = this.businessCart.totalQuantity;
  readonly subtotal = this.businessCart.subtotal;
  readonly hasActiveMenuSearch = computed(() => hasText(this.menuSearchQuery()));
  readonly isGlobalSearchContext = computed(
    () => this.searchSource() === 'global' && this.hasActiveMenuSearch(),
  );
  readonly isProductDetailCategoryContext = computed(
    () => this.searchSource() === 'product-detail' && hasText(this.matchedCategoryName()),
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
      .filter((category): category is CatalogCategoryResponse => category !== null);

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
        if (params.searchSource === 'global' && hasText(params.matchedItemId)) {
          this.matchedItemBannerMessage.set('Encontramos este producto en este negocio');
        } else if (this.matchedItemBannerMessage() !== 'El producto ya no está disponible') {
          this.matchedItemBannerMessage.set('');
        }

        if (this.menuSearchControl.getRawValue() !== params.menuSearch) {
          this.menuSearchControl.setValue(params.menuSearch, { emitEvent: false });
        }

        if (!this.isGlobalSearchContext()) {
          this.clearMatchedItemHighlight();
        }

        if (!this.isProductDetailCategoryContext()) {
          this.handledCategoryFocusKey = '';
        }

        this.tryHandleMatchedItemFocus();
        this.tryHandleCategoryFocus();
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

    this.route.paramMap
      .pipe(
        map((params) => params.get('id')?.trim() || params.get('businessId')?.trim() || ''),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((businessId) => {
        this.loadBusiness(businessId);
      });
  }

  ngOnDestroy(): void {
    if (this.flyAnimationTimeoutId !== null) {
      clearTimeout(this.flyAnimationTimeoutId);
      this.flyAnimationTimeoutId = null;
    }

    if (this.highlightTimeoutId !== null) {
      clearTimeout(this.highlightTimeoutId);
      this.highlightTimeoutId = null;
    }

    if (this.pendingMatchedItemFocusTimeoutId !== null) {
      clearTimeout(this.pendingMatchedItemFocusTimeoutId);
      this.pendingMatchedItemFocusTimeoutId = null;
    }

    if (this.pendingCategoryFocusTimeoutId !== null) {
      clearTimeout(this.pendingCategoryFocusTimeoutId);
      this.pendingCategoryFocusTimeoutId = null;
    }

    this.activeFlyAnimation.set(null);
  }

  addItem(item: CatalogItemResponse): boolean {
    if (!item.isAvailable) {
      return false;
    }

    this.checkoutErrorMessage.set('');
    const business = this.restaurant();
    const wasAdded = this.businessCart.addItemFromBusiness({
      businessId: business?.id ?? '',
      businessName: business?.name ?? '',
      item: {
        id: item.id,
        name: item.name,
        price: item.price,
      },
    });

    if (!wasAdded) {
      return false;
    }

    this.recentlyAddedMessage.set(`${item.name} se agregó a tu pedido.`);
    this.notificationService.success('Producto agregado al carrito.');
    return true;
  }
  incrementItem(menuItemId: string): void {
    this.businessCart.incrementItem(menuItemId);
  }

  decrementItem(menuItemId: string): void {
    this.businessCart.decrementItem(menuItemId);
  }

  removeItem(menuItemId: string): void {
    this.businessCart.removeItem(menuItemId);

    if (!this.cartItems().length) {
      this.recentlyAddedMessage.set('');
    }
  }

  getItemQuantity(menuItemId: string): number {
    return this.businessCart.getItemQuantity(menuItemId);
  }

  clearMenuSearch(): void {
    this.menuSearchControl.setValue('');
  }

  clearGlobalSearchContext(): void {
    this.clearMatchedItemHighlight();
    this.selectedCategoryId.set('all');
    this.matchedItemBannerMessage.set('');
    this.handledGlobalFocusKey = '';
    this.menuSearchQuery.set('');
    this.menuSearchControl.setValue('', { emitEvent: false });

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        menuSearch: null,
        matchedItemId: null,
        matchedCategoryName: null,
        searchSource: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  addItemWithAnimation(item: CatalogItemResponse, event: MouseEvent): void {
    if (!item.isAvailable || this.isAnimatingAddFor(item.id)) {
      return;
    }

    this.setAnimatingAdd(item.id, true);
    const wasAdded = this.addItem(item);

    if (!wasAdded) {
      this.finishAddAnimation(item.id);
      return;
    }

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
        }, BusinessDetailPageComponent.FLY_ANIMATION_DURATION_MS);
      });
    });
  }

  isAnimatingAddFor(menuItemId: string): boolean {
    return this.animatingAddByItemId()[menuItemId] ?? false;
  }

  selectCategory(categoryId: 'all' | string): void {
    this.selectedCategoryId.set(categoryId);
  }

  getCategoryPreviewImage(category: CatalogCategoryResponse): string {
    return category.items.find((item) => hasText(item.imageUrl))?.imageUrl ?? this.catalogPlaceholderImage;
  }

  handleCategoryPreviewImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith(this.catalogPlaceholderImage)) {
      return;
    }

    image.src = this.catalogPlaceholderImage;
  }

  openCheckoutDrawer(): void {
    this.checkoutDrawerUi.open();
  }

  closeCheckoutDrawer(): void {
    this.checkoutDrawerUi.close();
  }

  goBackToBusinesses(): void {
    void this.router.navigate(['/businesses']);
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
      const message = 'No encontramos la zona del negocio para crear el pedido.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.error(message);
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    const paymentMethod = BusinessDetailPageComponent.PAYMENT_METHOD_TO_ENUM[formValue.paymentMethod];

    const payload: CreateOrderRequest = {
      clientRequestId: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `req-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
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
          this.businessCart.clear();
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
      : 'Este negocio aún no tiene catálogo visible';
  }

  menuEmptyStateMessage(): string {
    if (this.hasActiveMenuSearch()) {
      if (this.isGlobalSearchContext()) {
        return 'Este negocio no tiene coincidencias visibles para esa búsqueda. Limpia el filtro local o vuelve a los resultados globales.';
      }

      return 'Prueba con otro nombre de plato, una descripción más corta o una categoría distinta.';
    }

    return 'Cuando publique categorías e items disponibles, aparecerán aquí para pedir.';
  }

  isMatchedSearchItem(menuItemId: string): boolean {
    return this.isGlobalSearchContext() && this.matchedItemId() === menuItemId;
  }

  matchedItemElementId(menuItemId: string): string {
    return `matched-menu-item-${menuItemId}`;
  }

  categorySectionElementId(categoryId: string): string {
    return `business-category-section-${categoryId}`;
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

  private filterCategory(category: CatalogCategoryResponse, query: string): CatalogCategoryResponse | null {
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

  markBusinessHeroImageFailed(): void {
    this.businessHeroImageFailed.set(true);
  }

  private loadBusiness(businessId: string): void {
    this.checkoutDrawerUi.close();
    this.restaurant.set(null);
    this.menu.set(null);
    this.businessHeroImageFailed.set(false);
    this.errorMessage.set('');

    if (!businessId) {
      const message = 'No se encontró el negocio solicitado.';
      this.errorMessage.set(message);
      this.notificationService.error(message);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);

    forkJoin({
      restaurant: this.businessesApi.getBusiness(businessId),
      menu: this.businessesApi.getBusinessCatalog(businessId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ restaurant, menu }) => {
          this.restaurant.set(restaurant);
          this.menu.set(menu);
          this.isLoading.set(false);
          this.tryHandleMatchedItemFocus();
          this.tryHandleCategoryFocus();
        },
        error: (error) => {
          const message =
            error?.status === 404
              ? 'Este negocio ya no está disponible para el público.'
              : getApiErrorMessage(error, 'Revisa tu conexión o vuelve al listado para intentarlo otra vez.');
          this.errorMessage.set(message);
          this.notificationService.error(message);
          this.isLoading.set(false);
        },
      });
  }

  private tryHandleMatchedItemFocus(): void {
    if (!this.isGlobalSearchContext() || !hasText(this.matchedItemId()) || this.isLoading()) {
      return;
    }

    const menu = this.menu();

    if (!menu) {
      return;
    }

    const focusKey = `${this.restaurant()?.id ?? ''}:${this.menuSearchQuery()}:${this.matchedItemId()}:${this.matchedCategoryName()}`;

    if (this.handledGlobalFocusKey === focusKey) {
      return;
    }

    const match = this.findMatchedItem(menu);

    if (!match || !match.item.isAvailable) {
      this.handleUnavailableMatchedItem();
      return;
    }

    const requestedCategory = this.findCategoryByName(menu, this.matchedCategoryName());
    const targetCategory = requestedCategory?.items.some((item) => item.id === match.item.id) ? requestedCategory : match.category;
    this.selectedCategoryId.set(targetCategory.id);
    this.scheduleMatchedItemFocus(focusKey, match.item.id, 0);
  }

  private tryHandleCategoryFocus(): void {
    if (!this.isProductDetailCategoryContext() || this.isLoading()) {
      return;
    }

    const menu = this.menu();

    if (!menu) {
      return;
    }

    const matchedCategory = this.findCategoryByName(menu, this.matchedCategoryName());

    if (!matchedCategory) {
      this.selectedCategoryId.set('all');
      this.handledCategoryFocusKey = '';
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          matchedCategoryName: null,
          searchSource: null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }

    const focusKey = `${this.restaurant()?.id ?? ''}:${matchedCategory.id}:${this.matchedCategoryName()}`;

    if (this.handledCategoryFocusKey === focusKey) {
      return;
    }

    this.selectedCategoryId.set(matchedCategory.id);
    this.scheduleCategoryFocus(focusKey, matchedCategory.id, 0);
  }

  private scheduleMatchedItemFocus(focusKey: string, menuItemId: string, attempt: number): void {
    if (this.pendingMatchedItemFocusTimeoutId !== null) {
      clearTimeout(this.pendingMatchedItemFocusTimeoutId);
      this.pendingMatchedItemFocusTimeoutId = null;
    }

    this.pendingMatchedItemFocusTimeoutId = setTimeout(() => {
      this.pendingMatchedItemFocusTimeoutId = null;

      if (this.handledGlobalFocusKey === focusKey) {
        return;
      }

      const matchedElement = this.document.getElementById(this.matchedItemElementId(menuItemId));

      if (!matchedElement) {
        if (attempt + 1 >= BusinessDetailPageComponent.MATCH_SCROLL_MAX_ATTEMPTS) {
          this.handleUnavailableMatchedItem();
          return;
        }

        this.scheduleMatchedItemFocus(focusKey, menuItemId, attempt + 1);
        return;
      }

      matchedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.highlightedMatchedItemId.set(menuItemId);
      this.matchedItemBannerMessage.set('Encontramos este producto en este negocio');
      this.handledGlobalFocusKey = focusKey;

      if (this.highlightTimeoutId !== null) {
        clearTimeout(this.highlightTimeoutId);
      }

      this.highlightTimeoutId = setTimeout(() => {
        this.highlightTimeoutId = null;
        this.highlightedMatchedItemId.set('');
      }, BusinessDetailPageComponent.MATCH_HIGHLIGHT_DURATION_MS);
    }, attempt === 0 ? 0 : BusinessDetailPageComponent.MATCH_SCROLL_RETRY_DELAY_MS);
  }

  private scheduleCategoryFocus(focusKey: string, categoryId: string, attempt: number): void {
    if (this.pendingCategoryFocusTimeoutId !== null) {
      clearTimeout(this.pendingCategoryFocusTimeoutId);
      this.pendingCategoryFocusTimeoutId = null;
    }

    this.pendingCategoryFocusTimeoutId = setTimeout(() => {
      this.pendingCategoryFocusTimeoutId = null;

      if (this.handledCategoryFocusKey === focusKey) {
        return;
      }

      const categoryElement = this.document.getElementById(this.categorySectionElementId(categoryId));

      if (!categoryElement) {
        if (attempt + 1 >= BusinessDetailPageComponent.CATEGORY_SCROLL_MAX_ATTEMPTS) {
          this.selectedCategoryId.set('all');
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              matchedCategoryName: null,
              searchSource: null,
            },
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
          return;
        }

        this.scheduleCategoryFocus(focusKey, categoryId, attempt + 1);
        return;
      }

      categoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      this.handledCategoryFocusKey = focusKey;
    }, attempt === 0 ? 0 : BusinessDetailPageComponent.CATEGORY_SCROLL_RETRY_DELAY_MS);
  }

  private findMatchedItem(menu: CatalogResponse): { category: CatalogCategoryResponse; item: CatalogItemResponse } | null {
    const matchedItemId = this.matchedItemId();

    for (const category of menu.categories) {
      const item = category.items.find((candidate) => candidate.id === matchedItemId);

      if (item) {
        return { category, item };
      }
    }

    return null;
  }

  private findCategoryByName(menu: CatalogResponse, categoryName: string): CatalogCategoryResponse | null {
    const normalizedCategoryName = this.normalizeCategoryName(categoryName);

    if (!normalizedCategoryName) {
      return null;
    }

    return (
      menu.categories.find((category) => this.normalizeCategoryName(category.name) === normalizedCategoryName) ?? null
    );
  }

  private handleUnavailableMatchedItem(): void {
    this.clearMatchedItemHighlight();
    this.selectedCategoryId.set('all');
    this.matchedItemBannerMessage.set('El producto ya no está disponible');
    this.handledGlobalFocusKey = '';
    this.menuSearchQuery.set('');
    this.menuSearchControl.setValue('', { emitEvent: false });

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        menuSearch: null,
        matchedItemId: null,
        matchedCategoryName: null,
        searchSource: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private clearMatchedItemHighlight(): void {
    if (this.highlightTimeoutId !== null) {
      clearTimeout(this.highlightTimeoutId);
      this.highlightTimeoutId = null;
    }

    if (this.pendingMatchedItemFocusTimeoutId !== null) {
      clearTimeout(this.pendingMatchedItemFocusTimeoutId);
      this.pendingMatchedItemFocusTimeoutId = null;
    }

    this.highlightedMatchedItemId.set('');
  }

  private normalizeCategoryName(value: string | null | undefined): string {
    return value?.trim().toLocaleLowerCase().replace(/\s+/g, '') ?? '';
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



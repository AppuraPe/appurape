import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule, Minus, Plus, RefreshCw, ShoppingCart, Store } from 'lucide-angular';
import { distinctUntilChanged, map } from 'rxjs';
import { PublicBusinessProductDetailResponse } from '../../core/models/businesses.models';
import { BusinessesApiService } from '../../core/services/businesses-api.service';
import { CheckoutDrawerUiService } from '../../core/services/checkout-drawer-ui.service';
import { NotificationService } from '../../core/services/notification.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { BusinessCartService } from './business-cart.service';
import { BusinessCheckoutDrawerComponent } from './business-checkout-drawer.component';

@Component({
  selector: 'app-business-product-detail-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, LucideAngularModule, AppBackButtonComponent, BusinessCheckoutDrawerComponent],
  templateUrl: './business-product-detail-page.component.html',
})
export class BusinessProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly businessesApi = inject(BusinessesApiService);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly businessCart = inject(BusinessCartService);

  readonly product = signal<PublicBusinessProductDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorTitle = signal('');
  readonly errorMessage = signal('');
  readonly businessId = signal('');
  readonly productId = signal('');
  readonly selectedQuantity = signal(1);
  readonly productHeroImageFailed = signal(false);
  readonly storeIcon = Store;
  readonly shoppingCartIcon = ShoppingCart;
  readonly plusIcon = Plus;
  readonly minusIcon = Minus;
  readonly refreshIcon = RefreshCw;

  readonly currentQuantityInCart = computed(() => {
    const product = this.product();
    return product ? this.businessCart.getItemQuantity(product.id) : 0;
  });
  readonly totalQuantityInCart = this.businessCart.totalQuantity;
  readonly canPurchase = computed(() => {
    const product = this.product();

    if (!product) {
      return false;
    }

    return product.businessIsActive && product.isActive && product.isAvailable && product.hasStock;
  });
  readonly availabilityLabel = computed(() => {
    const product = this.product();

    if (!product) {
      return '';
    }

    if (!product.businessIsActive) {
      return 'Negocio no disponible';
    }

    if (!product.isActive) {
      return 'Producto inactivo';
    }

    if (!product.isAvailable) {
      return 'No disponible';
    }

    if (!product.hasStock) {
      return 'Sin stock';
    }

    return 'Disponible para pedir';
  });
  readonly availabilityClass = computed(() => this.canPurchase() ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700');
  readonly stockLabel = computed(() => {
    const product = this.product();

    if (!product) {
      return '';
    }

    if (product.trackStock && product.stockQuantity !== null && product.stockQuantity !== undefined) {
      return product.stockQuantity > 0 ? `${product.stockQuantity} disponibles` : 'Sin stock';
    }

    return product.hasStock ? 'Stock disponible' : 'Sin stock';
  });
  readonly businessStatusLabel = computed(() => {
    const product = this.product();

    if (!product) {
      return '';
    }

    return product.businessIsOpen ? 'Abierto ahora' : 'Fuera de horario';
  });
  readonly categoryQueryParams = computed(() => {
    const product = this.product();

    if (!product) {
      return null;
    }

    return {
      matchedCategoryName: product.categoryName,
      searchSource: 'product-detail',
    };
  });
  readonly showProductHeroImage = computed(
    () => {
      const imageUrl = this.product()?.imageUrl?.trim();
      return !!imageUrl && !this.productHeroImageFailed();
    },
  );

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => ({
          businessId: params.get('businessId')?.trim() ?? '',
          productId: params.get('productId')?.trim() ?? '',
        })),
        distinctUntilChanged(
          (previous, current) =>
            previous.businessId === current.businessId && previous.productId === current.productId,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ businessId, productId }) => {
        this.businessId.set(businessId);
        this.productId.set(productId);
        this.loadProduct();
      });
  }

  incrementQuantity(): void {
    this.selectedQuantity.update((current) => current + 1);
  }

  decrementQuantity(): void {
    this.selectedQuantity.update((current) => Math.max(1, current - 1));
  }

  addToCart(): void {
    const product = this.product();

    if (!product || !this.canPurchase()) {
      return;
    }

    const wasAdded = this.businessCart.addItemFromBusiness({
      businessId: product.businessId,
      businessName: product.businessName,
      item: {
        id: product.id,
        name: product.name,
        price: product.price,
      },
      quantity: this.selectedQuantity(),
    });

    if (!wasAdded) {
      return;
    }

    this.notificationService.success('Producto agregado al carrito.');
    this.selectedQuantity.set(1);
  }

  openCheckoutDrawer(): void {
    if (!this.totalQuantityInCart()) {
      return;
    }

    this.checkoutDrawerUi.open();
  }

  reload(): void {
    this.loadProduct();
  }

  markProductHeroImageFailed(): void {
    this.productHeroImageFailed.set(true);
  }

  private loadProduct(): void {
    const businessId = this.businessId();
    const productId = this.productId();

    if (!businessId || !productId) {
      this.isLoading.set(false);
      this.errorTitle.set('No pudimos abrir este producto');
      this.errorMessage.set('La ruta del producto no es válida.');
      return;
    }

    this.isLoading.set(true);
    this.errorTitle.set('');
    this.errorMessage.set('');
    this.product.set(null);
    this.productHeroImageFailed.set(false);
    this.selectedQuantity.set(1);

    this.businessesApi
      .getBusinessProduct(businessId, productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorTitle.set(error?.status === 404 ? 'Producto no disponible' : 'No pudimos abrir este producto');
          this.errorMessage.set(
            error?.status === 404
              ? 'Este producto ya no está disponible para el público.'
              : getApiErrorMessage(error, 'Revisa tu conexión e inténtalo nuevamente.'),
          );
        },
      });
  }
}

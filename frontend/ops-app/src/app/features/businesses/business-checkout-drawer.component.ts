import { CurrencyPipe } from '@angular/common';
import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Trash2 } from 'lucide-angular';
import { distinctUntilChanged, map, merge } from 'rxjs';
import { BusinessDetailResponse } from '../../core/models/businesses.models';
import { CustomerAddressResponse } from '../../core/models/customer-addresses.models';
import { CreateOrderRequest, DeliveryMode, PaymentMethod, ValidateOrderResponse } from '../../core/models/orders.models';
import { AuthService } from '../../core/services/auth.service';
import { BusinessesApiService } from '../../core/services/businesses-api.service';
import { CheckoutDrawerUiService } from '../../core/services/checkout-drawer-ui.service';
import { CustomerAddressesApiService } from '../../core/services/customer-addresses-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage } from '../../core/utils/api-utils';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { BusinessCartService } from './business-cart.service';

type AddressMode = 'manual' | 'saved';

@Component({
  selector: 'app-business-checkout-drawer',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, LucideAngularModule, AppSurfaceCardComponent, AppNoticeComponent, AppButtonComponent, BottomSafeActionBarComponent],
  templateUrl: './business-checkout-drawer.component.html',
})
export class BusinessCheckoutDrawerComponent implements AfterViewInit, OnDestroy {
  private static readonly PAYMENT_METHOD_TO_ENUM: Record<PaymentMethod, number> = {
    Cash: 0,
    Yape: 1,
    Plin: 2,
    Card: 3,
  };
  private static readonly DELIVERY_MODE_TO_ENUM: Record<DeliveryMode, number> = {
    PickupOrDirect: 0,
    BusinessDelivery: 1,
    VerifiedDriverDelivery: 2,
    CommunityCollaboratorDelivery: 3,
  };

  private readonly formBuilder = inject(FormBuilder);
  private readonly checkoutDrawerUi = inject(CheckoutDrawerUiService);
  private readonly businessCart = inject(BusinessCartService);
  private readonly businessesApi = inject(BusinessesApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly customerAddressesApi = inject(CustomerAddressesApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private currentClientRequestId = '';
  private currentAttemptFingerprint = '';
  private isHydratingAddress = false;

  readonly manualAddressValue = 'manual';
  readonly paymentMethods: PaymentMethod[] = ['Cash', 'Yape', 'Plin', 'Card'];
  readonly deliveryModes: DeliveryMode[] = ['PickupOrDirect', 'BusinessDelivery', 'VerifiedDriverDelivery'];
  readonly cartItems = this.businessCart.cartItems;
  readonly totalQuantity = this.businessCart.totalQuantity;
  readonly subtotal = this.businessCart.subtotal;
  readonly pendingBusinessChange = this.businessCart.pendingBusinessChange;
  readonly isCheckoutDrawerOpen = this.checkoutDrawerUi.isOpen;
  readonly activeBusinessId = this.businessCart.activeBusinessId;
  readonly activeBusiness = signal<BusinessDetailResponse | null>(null);
  readonly customerAddresses = signal<CustomerAddressResponse[]>([]);
  readonly isLoadingBusiness = signal(false);
  readonly isLoadingCustomerAddresses = signal(false);
  readonly checkoutErrorMessage = signal('');
  readonly customerAddressesErrorMessage = signal('');
  readonly isSubmittingOrder = signal(false);
  readonly addressMode = signal<AddressMode>('manual');
  readonly selectedCustomerAddressId = signal<string | null>(null);
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());
  readonly currentRole = computed(() => this.authService.currentRole());
  readonly canUseCustomerCheckout = computed(() => this.isAuthenticated() && this.currentRole() === 'Customer');
  readonly submitDisabled = computed(() => this.isSubmittingOrder() || !this.cartItems().length || !this.activeBusiness());
  readonly selectedPaymentMethod = computed(() => this.checkoutForm.controls.paymentMethod.value);
  readonly selectedDeliveryMode = computed(() => this.checkoutForm.controls.deliveryMode.value);
  readonly verifiedDriverMinimum = computed(() => this.subtotal() < 20 ? 4 : 5);
  readonly estimatedDeliveryAmount = computed(() => {
    const mode = this.selectedDeliveryMode();
    if (mode === 'PickupOrDirect') {
      return 0;
    }

    if (mode === 'BusinessDelivery') {
      return this.activeBusiness()?.ownDeliveryFee ?? 0;
    }

    return Math.max(this.verifiedDriverMinimum(), Number(this.checkoutForm.controls.offeredDeliveryAmount.value || 0));
  });
  readonly estimatedServiceFee = computed(() => this.cartItems().length ? 1 : 0);
  readonly estimatedTotal = computed(() => this.subtotal() + this.estimatedDeliveryAmount() + this.estimatedServiceFee());
  readonly selectedCustomerAddress = computed(() => {
    const selectedAddressId = this.selectedCustomerAddressId();
    if (!selectedAddressId) {
      return null;
    }

    return this.customerAddresses().find((address) => address.id === selectedAddressId) ?? null;
  });
  readonly hasSavedAddresses = computed(() => this.customerAddresses().length > 0);
  readonly isManualAddressMode = computed(() => this.addressMode() === 'manual');
  readonly submitButtonLabel = computed(() => {
    if (this.isSubmittingOrder()) {
      return 'Enviando pedido...';
    }

    if (!this.isAuthenticated()) {
      return 'Iniciar sesión para pedir';
    }

    return this.canUseCustomerCheckout() ? 'Crear pedido' : 'Usar cuenta de cliente';
  });
  readonly trashIcon = Trash2;

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    savedCustomerAddressId: [this.manualAddressValue],
    deliveryAddress: ['', [Validators.required, Validators.maxLength(300)]],
    deliveryReference: ['', [Validators.required, Validators.maxLength(300)]],
    notes: ['', [Validators.maxLength(1000)]],
    paymentMethod: ['Cash' as PaymentMethod, [Validators.required]],
    deliveryMode: ['VerifiedDriverDelivery' as DeliveryMode, [Validators.required]],
    offeredDeliveryAmount: [4, [Validators.min(0)]],
  });

  @ViewChild('checkoutDrawerTemplate', { static: true })
  private checkoutDrawerTemplate?: TemplateRef<unknown>;

  @ViewChild('checkoutDrawerPanel')
  private checkoutDrawerPanel?: ElementRef<HTMLElement>;

  constructor() {
    toObservable(this.businessCart.activeBusinessId)
      .pipe(
        map((businessId) => businessId.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((businessId) => {
        if (!businessId) {
          this.activeBusiness.set(null);
          return;
        }

        this.isLoadingBusiness.set(true);
        this.checkoutErrorMessage.set('');

        this.businessesApi.getBusiness(businessId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (business) => {
            this.activeBusiness.set(business);
            this.isLoadingBusiness.set(false);
          },
          error: (error) => {
            this.activeBusiness.set(null);
            this.isLoadingBusiness.set(false);
            this.checkoutErrorMessage.set(getApiErrorMessage(error, 'No pudimos cargar el negocio del pedido.'));
          },
        });
      });

    toObservable(this.canUseCustomerCheckout)
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((canUseCustomerCheckout) => {
        if (!canUseCustomerCheckout) {
          this.customerAddresses.set([]);
          this.customerAddressesErrorMessage.set('');
          this.resetCheckoutForm();
          return;
        }

        this.loadCustomerAddresses();
      });

    this.checkoutForm.controls.savedCustomerAddressId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (this.isHydratingAddress) {
          return;
        }

        this.onAddressSelectionChange(value);
      });

    merge(
      this.checkoutForm.controls.deliveryAddress.valueChanges,
      this.checkoutForm.controls.deliveryReference.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkoutErrorMessage.set('');
        if (this.isHydratingAddress || this.addressMode() !== 'saved') {
          return;
        }

        const selectedAddress = this.selectedCustomerAddress();
        if (!selectedAddress) {
          return;
        }

        const formValue = this.checkoutForm.getRawValue();
        if (
          formValue.deliveryAddress.trim() === selectedAddress.addressLine &&
          formValue.deliveryReference.trim() === selectedAddress.reference
        ) {
          return;
        }

        this.activateManualAddressMode();
      });

    merge(
      this.checkoutForm.controls.notes.valueChanges,
      this.checkoutForm.controls.paymentMethod.valueChanges,
      this.checkoutForm.controls.deliveryMode.valueChanges,
      this.checkoutForm.controls.offeredDeliveryAmount.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.checkoutErrorMessage.set(''));
  }

  ngAfterViewInit(): void {
    if (!this.checkoutDrawerTemplate) {
      return;
    }

    this.checkoutDrawerUi.register(this.checkoutDrawerTemplate, this);
  }

  ngOnDestroy(): void {
    this.checkoutDrawerUi.unregister(this.checkoutDrawerTemplate);
  }

  openCheckoutDrawer(): void {
    this.prepareCheckoutDrawerSession();
    this.checkoutDrawerUi.open();
    setTimeout(() => this.scrollDrawerToTop(), 0);
  }

  closeCheckoutDrawer(): void {
    this.checkoutDrawerUi.close();
    this.resetCheckoutDraftState();
  }

  incrementItem(menuItemId: string): void {
    this.businessCart.incrementItem(menuItemId);
  }

  decrementItem(menuItemId: string): void {
    this.businessCart.decrementItem(menuItemId);
  }

  removeItem(menuItemId: string): void {
    this.businessCart.removeItem(menuItemId);
  }

  cancelBusinessChange(): void {
    this.businessCart.cancelPendingBusinessChange();
  }

  confirmBusinessChange(): void {
    this.businessCart.confirmPendingBusinessChange();
  }

  selectPaymentMethod(method: PaymentMethod): void {
    if (method === 'Card') {
      return;
    }

    this.checkoutForm.controls.paymentMethod.setValue(method);
    this.resetClientRequestAttempt();
    this.checkoutErrorMessage.set('');
  }

  selectDeliveryMode(mode: DeliveryMode): void {
    const business = this.activeBusiness();
    if (mode === 'BusinessDelivery' && !business?.hasOwnDelivery) {
      this.notificationService.info('Este negocio todavía no tiene delivery propio configurado.');
      return;
    }

    this.checkoutForm.controls.deliveryMode.setValue(mode);
    if (mode === 'VerifiedDriverDelivery') {
      this.checkoutForm.controls.offeredDeliveryAmount.setValue(this.verifiedDriverMinimum());
    }
    this.updateAddressValidators(mode);

    this.resetClientRequestAttempt();
    this.checkoutErrorMessage.set('');
  }

  selectCustomerAddress(addressId: string): void {
    this.checkoutForm.controls.savedCustomerAddressId.setValue(addressId || this.manualAddressValue);
  }

  manageAddresses(): void {
    this.closeCheckoutDrawer();
    void this.router.navigate(['/account/addresses']);
  }

  paymentMethodHelpText(method: PaymentMethod): string {
    switch (method) {
      case 'Cash':
        return 'Paga al recibir tu pedido.';
      case 'Yape':
      case 'Plin':
        return 'Paga directamente al negocio. El pedido quedará pendiente hasta que el negocio confirme el pago.';
      default:
        return 'Próximamente';
    }
  }

  deliveryModeLabel(mode: DeliveryMode): string {
    switch (mode) {
      case 'PickupOrDirect':
        return 'Retiro / coordinar';
      case 'BusinessDelivery':
        return 'Delivery del negocio';
      case 'VerifiedDriverDelivery':
        return 'Driver verificado';
      case 'CommunityCollaboratorDelivery':
        return 'Colaborador verificado';
    }
  }

  deliveryModeHelpText(mode: DeliveryMode): string {
    switch (mode) {
      case 'PickupOrDirect':
        return 'Coordina directamente con el negocio. No se suma pago a driver.';
      case 'BusinessDelivery':
        return this.activeBusiness()?.hasOwnDelivery
          ? `El negocio entrega por ${this.formatMoney(this.activeBusiness()?.ownDeliveryFee ?? 0)}.`
          : 'No disponible por ahora para este negocio.';
      case 'VerifiedDriverDelivery':
        return `Pago mínimo al driver: ${this.formatMoney(this.verifiedDriverMinimum())}. Puedes ofrecer más.`;
      case 'CommunityCollaboratorDelivery':
        return 'Solicita el recojo desde el detalle del pedido después de comprar.';
    }
  }

  submitOrder(): void {
    if (!this.isAuthenticated()) {
      this.notificationService.info('Inicia sesión para continuar con tu pedido.');
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    if (!this.canUseCustomerCheckout()) {
      const message = 'Esta cuenta no puede crear pedidos. Ingresa con una cuenta de cliente para comprar.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.warning(message);
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

    const business = this.activeBusiness();

    if (!business?.zoneId) {
      const message = 'No encontramos la zona del negocio para crear el pedido.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.error(message);
      return;
    }

    const formValue = this.checkoutForm.getRawValue();
    const paymentMethod = BusinessCheckoutDrawerComponent.PAYMENT_METHOD_TO_ENUM[formValue.paymentMethod];
    const deliveryMode = BusinessCheckoutDrawerComponent.DELIVERY_MODE_TO_ENUM[formValue.deliveryMode];
    const selectedAddress = this.resolveSelectedCustomerAddressForPayload();
    const resolvedZoneId = selectedAddress?.zoneId ?? business.zoneId;
    const offeredDeliveryAmount = formValue.deliveryMode === 'VerifiedDriverDelivery'
      ? Number(formValue.offeredDeliveryAmount || this.verifiedDriverMinimum())
      : undefined;

    if (formValue.paymentMethod === 'Card') {
      const message = 'Pago con tarjeta: Próximamente.';
      this.checkoutErrorMessage.set(message);
      this.notificationService.info(message);
      return;
    }

    const payload: CreateOrderRequest = {
      clientRequestId: this.ensureClientRequestId(
        business.id,
        resolvedZoneId,
        formValue.deliveryAddress.trim(),
        formValue.deliveryReference.trim(),
        formValue.notes.trim(),
        paymentMethod,
        deliveryMode,
        offeredDeliveryAmount ?? 0,
      ),
      restaurantId: business.id,
      customerAddressId: selectedAddress?.id,
      zoneId: resolvedZoneId,
      deliveryAddress: formValue.deliveryAddress.trim(),
      deliveryReference: formValue.deliveryReference.trim(),
      notes: formValue.notes.trim() || undefined,
      paymentMethod,
      deliveryMode,
      offeredDeliveryAmount,
      items: this.cartItems().map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        clientUnitPrice: item.price,
      })),
    };

    this.isSubmittingOrder.set(true);
    this.checkoutErrorMessage.set('');

    this.ordersApi.validateOrder(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (validation) => {
        if (!validation.canCreateOrder || validation.hasChanges) {
          this.isSubmittingOrder.set(false);
          this.applyValidatedCart(validation, business.id, business.name);
          this.resetClientRequestAttempt();
          const message = this.buildValidationMessage(validation);
          this.checkoutErrorMessage.set(message);
          this.notificationService.warning(message);
          return;
        }

        this.createOrder(payload);
      },
      error: (error) => {
        this.isSubmittingOrder.set(false);
        const status = (error as { status?: number } | null)?.status;
        const message = status === 401
          ? 'Tu sesión ha vencido. Inicia sesión nuevamente para continuar con tu pedido.'
          : status === 403
            ? 'No puedes crear este pedido con la cuenta actual. Ingresa con una cuenta de cliente.'
            : getApiErrorMessage(error, 'No pudimos validar tu carrito. Intenta nuevamente.');
        this.checkoutErrorMessage.set(message);
        this.notificationService.error(message);
      },
    });
  }

  private onAddressSelectionChange(value: string): void {
    this.resetClientRequestAttempt();

    if (!value || value === this.manualAddressValue) {
      this.activateManualAddressMode();
      return;
    }

    const address = this.customerAddresses().find((item) => item.id === value) ?? null;
    if (!address) {
      this.activateManualAddressMode();
      return;
    }

    this.applySavedAddress(address);
  }

  private applySavedAddress(address: CustomerAddressResponse): void {
    this.isHydratingAddress = true;
    this.selectedCustomerAddressId.set(address.id);
    this.addressMode.set('saved');
    this.checkoutForm.patchValue({
      savedCustomerAddressId: address.id,
      deliveryAddress: address.addressLine,
      deliveryReference: address.reference ?? '',
    }, { emitEvent: false });
    this.isHydratingAddress = false;
  }

  private activateManualAddressMode(): void {
    this.isHydratingAddress = true;
    this.selectedCustomerAddressId.set(null);
    this.addressMode.set('manual');
    this.checkoutForm.patchValue({
      savedCustomerAddressId: this.manualAddressValue,
    }, { emitEvent: false });
    this.isHydratingAddress = false;
  }

  private createOrder(payload: CreateOrderRequest): void {
    this.ordersApi.createOrder(payload).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (order) => {
        this.isSubmittingOrder.set(false);
        this.checkoutDrawerUi.close();
        this.resetClientRequestAttempt();
        this.businessCart.clear();
        this.resetCheckoutForm();
        this.scrollDrawerToTop();
        this.notificationService.success(
          payload.paymentMethod === BusinessCheckoutDrawerComponent.PAYMENT_METHOD_TO_ENUM.Yape ||
            payload.paymentMethod === BusinessCheckoutDrawerComponent.PAYMENT_METHOD_TO_ENUM.Plin
            ? 'Pedido creado. Pago pendiente de confirmación por el negocio.'
            : 'Pedido creado correctamente.',
        );
        void this.router.navigate(['/orders', order.id], {
          queryParams: { created: '1' },
        });
      },
      error: () => {
        this.isSubmittingOrder.set(false);
        const message = 'No se pudo crear el pedido. Intenta nuevamente.';
        this.checkoutErrorMessage.set(message);
        this.notificationService.error(message);
      },
    });
  }

  private applyValidatedCart(validation: ValidateOrderResponse, businessId: string, businessName: string): void {
    const validItems = validation.items
      .filter((item) => !item.removed && item.validatedQuantity > 0)
      .map((item) => ({
        menuItemId: item.menuItemId,
        name: item.productName,
        price: item.currentUnitPrice,
        quantity: item.validatedQuantity,
      }));

    this.businessCart.syncValidatedCart({
      businessId,
      businessName,
      items: validItems,
    });
  }

  private buildValidationMessage(validation: ValidateOrderResponse): string {
    const messages = validation.items
      .filter((item) => item.removed || item.quantityAdjusted || item.priceChanged)
      .map((item) => {
        if (item.removed && !item.hasStock) {
          return `${item.productName}: sin stock.`;
        }

        if (item.removed) {
          return `${item.productName}: ya no está disponible.`;
        }

        if (item.quantityAdjusted) {
          return `${item.productName}: cantidad ajustada a ${item.validatedQuantity}.`;
        }

        if (item.priceChanged) {
          return `${item.productName}: precio actualizado.`;
        }

        return item.message;
      });

    if (!messages.length) {
      return 'Validamos tu carrito. Revisa el pedido y confirma nuevamente para continuar.';
    }

    return `${messages.join(' ')} Revisa el carrito y confirma nuevamente para continuar.`;
  }

  private ensureClientRequestId(
    businessId: string,
    zoneId: string,
    deliveryAddress: string,
    deliveryReference: string,
    notes: string,
    paymentMethod: number,
    deliveryMode: number,
    offeredDeliveryAmount: number,
  ): string {
    const fingerprint = JSON.stringify({
      businessId,
      zoneId,
      deliveryAddress,
      deliveryReference,
      notes,
      paymentMethod,
      deliveryMode,
      offeredDeliveryAmount,
      items: this.cartItems().map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      })),
    });

    if (!this.currentClientRequestId || this.currentAttemptFingerprint !== fingerprint) {
      this.currentClientRequestId = this.generateClientRequestId();
      this.currentAttemptFingerprint = fingerprint;
    }

    return this.currentClientRequestId;
  }

  private generateClientRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `req-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private resetClientRequestAttempt(): void {
    this.currentClientRequestId = '';
    this.currentAttemptFingerprint = '';
  }

  private loadCustomerAddresses(): void {
    this.isLoadingCustomerAddresses.set(true);
    this.customerAddressesErrorMessage.set('');

    this.customerAddressesApi.getMyAddresses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (addresses) => {
        const sortedAddresses = [...addresses].sort((left, right) => {
          if (left.isDefault !== right.isDefault) {
            return left.isDefault ? -1 : 1;
          }

          return new Date(right.updatedAtUtc ?? right.createdAtUtc).getTime() - new Date(left.updatedAtUtc ?? left.createdAtUtc).getTime();
        });

        this.customerAddresses.set(sortedAddresses);
        this.isLoadingCustomerAddresses.set(false);

        const selectedAddress = sortedAddresses.find((address) => address.id === this.selectedCustomerAddressId())
          ?? sortedAddresses.find((address) => address.isDefault)
          ?? sortedAddresses[0]
          ?? null;

        if (selectedAddress) {
          this.applySavedAddress(selectedAddress);
          return;
        }

        this.resetCheckoutForm();
      },
      error: (error) => {
        this.isLoadingCustomerAddresses.set(false);
        this.customerAddresses.set([]);
        this.customerAddressesErrorMessage.set(getApiErrorMessage(error, 'No pudimos cargar tus direcciones guardadas.'));
        this.resetCheckoutForm();
      },
    });
  }

  private resolveSelectedCustomerAddressForPayload(): CustomerAddressResponse | null {
    if (this.addressMode() !== 'saved') {
      return null;
    }

    const selectedAddress = this.selectedCustomerAddress();
    if (!selectedAddress) {
      return null;
    }

    const formValue = this.checkoutForm.getRawValue();
    if (
      formValue.deliveryAddress.trim() !== selectedAddress.addressLine ||
      formValue.deliveryReference.trim() !== selectedAddress.reference
    ) {
      return null;
    }

    return selectedAddress;
  }

  private prepareCheckoutDrawerSession(): void {
    this.resetClientRequestAttempt();
    this.isSubmittingOrder.set(false);
    this.checkoutErrorMessage.set('');
    this.customerAddressesErrorMessage.set('');
    this.resetCheckoutForm();

    if (this.canUseCustomerCheckout()) {
      this.loadCustomerAddresses();
    }
  }

  private resetCheckoutDraftState(): void {
    this.resetClientRequestAttempt();
    this.isSubmittingOrder.set(false);
    this.checkoutErrorMessage.set('');
    this.resetCheckoutForm();
    this.scrollDrawerToTop();
  }

  private scrollDrawerToTop(): void {
    this.checkoutDrawerPanel?.nativeElement.scrollTo({ top: 0, behavior: 'auto' });
  }

  private resetCheckoutForm(): void {
    const defaultAddress = this.customerAddresses().find((address) => address.isDefault) ?? this.customerAddresses()[0] ?? null;

    this.isHydratingAddress = true;
    this.checkoutForm.reset({
      savedCustomerAddressId: defaultAddress?.id ?? this.manualAddressValue,
      deliveryAddress: defaultAddress?.addressLine ?? '',
      deliveryReference: defaultAddress?.reference ?? '',
      notes: '',
      paymentMethod: 'Cash',
      deliveryMode: 'VerifiedDriverDelivery',
      offeredDeliveryAmount: this.verifiedDriverMinimum(),
    }, { emitEvent: false });
    this.selectedCustomerAddressId.set(defaultAddress?.id ?? null);
    this.addressMode.set(defaultAddress ? 'saved' : 'manual');
    this.isHydratingAddress = false;
    this.updateAddressValidators('VerifiedDriverDelivery');
  }

  private updateAddressValidators(mode: DeliveryMode): void {
    const controls = [this.checkoutForm.controls.deliveryAddress, this.checkoutForm.controls.deliveryReference];
    for (const control of controls) {
      if (mode === 'PickupOrDirect') {
        control.clearValidators();
        control.addValidators(Validators.maxLength(300));
      } else {
        control.setValidators([Validators.required, Validators.maxLength(300)]);
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

  private formatMoney(amount: number): string {
    return `S/ ${amount.toFixed(2)}`;
  }
}

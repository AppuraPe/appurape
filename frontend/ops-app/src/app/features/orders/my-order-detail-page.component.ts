import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CalendarDays,
  Clock3,
  LucideAngularModule,
  MapPinned,
  Package,
  ReceiptText,
  ScrollText,
  Ticket,
  Truck,
} from 'lucide-angular';
import { CustomerOrderDetailResponse, OrderCollaboratorPickupQuoteResponse, OrderDeliveryConfirmationResponse, OrderFulfillmentOptionsResponse, RefundResponse } from '../../core/models/orders.models';
import { CustomerAddressResponse } from '../../core/models/customer-addresses.models';
import { CustomerAddressesApiService } from '../../core/services/customer-addresses-api.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { ActionChipRowComponent } from '../../shared/components/action-chip-row.component';
import { AppBackButtonComponent } from '../../shared/components/app-back-button.component';
import { AppButtonComponent } from '../../shared/components/app-button.component';
import { AppNoticeComponent } from '../../shared/components/app-notice.component';
import { AppSurfaceCardComponent } from '../../shared/components/app-surface-card.component';
import { BottomSafeActionBarComponent } from '../../shared/components/bottom-safe-action-bar.component';
import { InternalPageSectionHeaderComponent } from '../../shared/components/internal-page-section-header.component';
import { MobilePageShellComponent } from '../../shared/components/mobile-page-shell.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { UnifiedEmptyStateComponent } from '../../shared/components/unified-empty-state.component';
import { UnifiedLoadingStateComponent } from '../../shared/components/unified-loading-state.component';

@Component({
  selector: 'app-my-order-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    AppBackButtonComponent,
    MobilePageShellComponent,
    AppSurfaceCardComponent,
    AppButtonComponent,
    AppNoticeComponent,
    StatusBadgeComponent,
    UnifiedEmptyStateComponent,
    UnifiedLoadingStateComponent,
    InternalPageSectionHeaderComponent,
    ActionChipRowComponent,
    BottomSafeActionBarComponent,
  ],
  templateUrl: './my-order-detail-page.component.html',
})
export class MyOrderDetailPageComponent {
  private static readonly PRODUCT_PLACEHOLDER_IMAGE = '/img/catalog-placeholder.svg';
  private static readonly TRACKING_PLACEHOLDER_IMAGE = '/img/order-status-placeholder.svg';
  private readonly formBuilder = inject(FormBuilder);
  private readonly addressesApi = inject(CustomerAddressesApiService);
  private readonly trackingStates = [
    {
      key: 'Created',
      label: 'Creado',
      description: 'Tu pedido fue registrado correctamente y ya se encuentra en cola para ser atendido.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'Accepted',
      label: 'Aceptado',
      description: 'El negocio confirmó tu pedido y ya empezó a organizar la preparación.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'Preparing',
      label: 'En preparación',
      description: 'La cocina está trabajando en tu pedido para dejarlo listo cuanto antes.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'ReadyForPickup',
      label: 'Listo para recoger',
      description: 'El pedido ya está empaquetado y esperando la siguiente etapa del envío.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'Assigned',
      label: 'Repartidor asignado',
      description: 'Ya encontramos quién llevará tu pedido y se está coordinando la salida.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'PickedUp',
      label: 'Recogido',
      description: 'El pedido salió del negocio y va rumbo a tu dirección.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'OnTheWay',
      label: 'En camino',
      description: 'Tu pedido ya está en ruta y falta poco para que llegue.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
    {
      key: 'Delivered',
      label: 'Entregado',
      description: 'El pedido fue entregado. Esperamos que disfrutes tu comida.',
      gifUrl: MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE,
    },
  ] as const;

  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<CustomerOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly ratingMessage = signal('');
  readonly isSubmittingRating = signal(false);
  readonly isSubmittingPaymentEvidence = signal(false);
  readonly paymentEvidenceFile = signal<File | null>(null);
  readonly paymentEvidenceError = signal('');
  readonly refund = signal<RefundResponse | null>(null);
  readonly refundSubmitting = signal(false);
  readonly paymentEvidenceForm = this.formBuilder.nonNullable.group({
    operationNumber: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(80)]],
    paidAtLocal: [new Date().toISOString().slice(0, 16), Validators.required],
  });
  readonly fulfillmentOptions = signal<OrderFulfillmentOptionsResponse | null>(null);
  readonly pickupQuote = signal<OrderCollaboratorPickupQuoteResponse | null>(null);
  readonly addresses = signal<CustomerAddressResponse[]>([]);
  readonly deliveryConfirmation = signal<OrderDeliveryConfirmationResponse | null>(null);
  readonly isQuotingPickup = signal(false);
  readonly isCreatingPickup = signal(false);
  readonly isRequestingDriver = signal(false);
  readonly pickupPanelOpen = signal(false);
  readonly trackingMode = signal<'current' | 'history'>('current');
  readonly hasText = hasText;
  readonly receiptIcon = ReceiptText;
  readonly packageIcon = Package;
  readonly calendarIcon = CalendarDays;
  readonly clockIcon = Clock3;
  readonly deliveryIcon = MapPinned;
  readonly timelineIcon = ScrollText;
  readonly ticketIcon = Ticket;
  readonly truckIcon = Truck;
  readonly timelineSteps = computed(() => {
    const order = this.order();
    if (!order) {
      return [];
    }

    return [
      { key: 'Created', label: 'Creado', timestamp: order.createdAtUtc },
      { key: 'Accepted', label: 'Aceptado', timestamp: order.acceptedAtUtc },
      { key: 'ReadyForPickup', label: 'Listo', timestamp: order.readyAtUtc },
      { key: 'PickedUp', label: 'Recogido', timestamp: order.pickedUpAtUtc },
      { key: 'Delivered', label: 'Entregado', timestamp: order.deliveredAtUtc },
    ];
  });
  readonly trackingProgressChips = computed(() => {
    const activeKey = this.activeTrackingState().key;
    const progressKeys = ['Created', 'Accepted', 'ReadyForPickup', 'PickedUp', 'Delivered'] as const;
    const activeIndex = Array.from(progressKeys).indexOf(activeKey as (typeof progressKeys)[number]);

    return progressKeys.map((key, index) => ({
      key,
      label: this.findTrackingState(key).label,
      isActive: activeIndex >= index,
      isCurrent: activeKey === key,
    }));
  });
  readonly activeTrackingState = computed(() => {
    const order = this.order();
    if (!order) {
      return this.trackingStates[0];
    }

    if (order.status === 'Delivered' || order.deliveredAtUtc) {
      return this.findTrackingState('Delivered');
    }

    if (order.status === 'OnTheWay') {
      return this.findTrackingState('OnTheWay');
    }

    if (order.status === 'PickedUp' || order.pickedUpAtUtc) {
      return this.findTrackingState('PickedUp');
    }

    if (order.status === 'Assigned') {
      return this.findTrackingState('Assigned');
    }

    if (order.status === 'ReadyForPickup' || order.readyAtUtc) {
      return this.findTrackingState('ReadyForPickup');
    }

    if (order.status === 'Preparing') {
      return this.findTrackingState('Preparing');
    }

    if (order.status === 'Accepted' || order.acceptedAtUtc) {
      return this.findTrackingState('Accepted');
    }

    return this.findTrackingState('Created');
  });
  readonly orderIdentity = computed(() => {
    const order = this.order();
    if (!order) {
      return [];
    }

    return [
      { label: 'Pedido', value: order.id, icon: this.receiptIcon },
      { label: 'Tracking', value: this.shortOrderId(order.id), icon: this.packageIcon },
      { label: 'Creado', value: new Date(order.createdAtUtc), icon: this.calendarIcon },
    ] as const;
  });
  readonly ratingForm = this.formBuilder.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: [''],
  });
  readonly pickupForm = this.formBuilder.nonNullable.group({
    compensationAmount: [5, [Validators.required, Validators.min(2)]],
    customerAddressId: ['', Validators.required],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const created = this.route.snapshot.queryParamMap.get('created');

    if (created === '1') {
      this.notificationService.success('Tu pedido fue enviado al negocio. Ahora puedes seguir su estado aquí.');
    }

    if (!id) {
      const message = 'No se encontró el pedido solicitado.';
      this.errorMessage.set(message);
      this.notificationService.error(message);
      this.isLoading.set(false);
      return;
    }

    this.loadOrder(id);
  }

  openPickupPanel(): void {
    this.pickupPanelOpen.set(true);
    this.pickupQuote.set(null);
  }

  quotePickup(): void {
    const order = this.order();
    if (!order || this.pickupForm.invalid) {
      this.pickupForm.markAllAsTouched();
      return;
    }
    this.isQuotingPickup.set(true);
    this.ordersApi.quoteCollaboratorPickup(order.id, this.pickupForm.controls.compensationAmount.value, this.pickupForm.controls.customerAddressId.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (quote) => {
          this.pickupQuote.set(quote);
          this.isQuotingPickup.set(false);
        },
        error: (error) => {
          this.notificationService.error(getApiErrorMessage(error, 'No pudimos calcular el recojo.'));
          this.isQuotingPickup.set(false);
        },
      });
  }

  confirmPickup(): void {
    const order = this.order();
    const quote = this.pickupQuote();
    if (!order || !quote) return;
    this.isCreatingPickup.set(true);
    this.ordersApi.createCollaboratorPickup(order.id, quote.quoteToken)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isCreatingPickup.set(false);
          this.pickupPanelOpen.set(false);
          this.pickupQuote.set(null);
          this.notificationService.success('El recojo fue publicado para colaboradores verificados.');
          this.fulfillmentOptions.set({
            orderId: order.id,
            currentDeliveryMode: 'CommunityCollaboratorDelivery',
            canRequestDriver: false,
            canRequestCollaborator: false,
            linkedCommunityRequestId: result.communityRequestId,
            unavailableReason: 'Este pedido ya tiene un recojo por colaborador activo.',
          });
          this.order.update((current) => current ? { ...current, deliveryMode: 'CommunityCollaboratorDelivery' } : current);
        },
        error: (error) => {
          this.notificationService.error(getApiErrorMessage(error, 'No pudimos publicar el recojo.'));
          this.isCreatingPickup.set(false);
        },
      });
  }

  requestDriverDelivery(): void {
    const order = this.order();
    if (!order || !this.pickupForm.controls.customerAddressId.value) {
      this.pickupForm.controls.customerAddressId.markAsTouched();
      this.notificationService.warning('Selecciona la dirección donde recibirás el pedido.');
      return;
    }
    this.isRequestingDriver.set(true);
    this.ordersApi.requestDriverDelivery(order.id, this.pickupForm.controls.customerAddressId.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isRequestingDriver.set(false);
          this.order.update((current) => current ? { ...current, deliveryMode: result.deliveryMode, deliveryFee: result.deliveryFee, total: result.total } : current);
          this.fulfillmentOptions.update((current) => current ? { ...current, currentDeliveryMode: result.deliveryMode, canRequestDriver: false, canRequestCollaborator: false, unavailableReason: 'El pedido ya solicita delivery con driver.' } : current);
          this.notificationService.success('Delivery solicitado. Aparecerá para drivers cuando el negocio termine de preparar el pedido.');
        },
        error: (error) => {
          this.isRequestingDriver.set(false);
          this.notificationService.error(getApiErrorMessage(error, 'No pudimos solicitar el delivery.'));
        },
      });
  }

  private loadFulfillmentOptions(orderId: string): void {
    this.ordersApi.getFulfillmentOptions(orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (options) => this.fulfillmentOptions.set(options), error: () => this.fulfillmentOptions.set(null) });
  }

  toggleTrackingMode(): void {
    this.trackingMode.update((mode) => (mode === 'current' ? 'history' : 'current'));
  }

  trackingButtonLabel(): string {
    return this.trackingMode() === 'current' ? 'Historial' : 'Cambiar';
  }

  canRateDriver(): boolean {
    const order = this.order();
    return !!order && order.status === 'Delivered' && !order.driverRating;
  }

  cancelOrder(): void {
    const order = this.order();
    if (!order || order.status !== 'Pending' || !window.confirm('¿Cancelar este pedido? Esta acción restaurará el stock.')) return;
    this.ordersApi.cancelOrder(order.id, 'Cancelado por el cliente').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.order.set(updated);
        if (updated.paymentStatus === 'RefundPending') this.loadRefund(updated.id);
        this.notificationService.success(updated.paymentStatus === 'RefundPending' ? 'Pedido cancelado. El negocio debe devolver el pago con comprobante.' : 'Pedido cancelado.');
      },
      error: (error) => this.notificationService.error(getApiErrorMessage(error, 'No se pudo cancelar el pedido.')),
    });
  }

  viewRefundEvidence(evidenceId: string): void {
    this.ordersApi.downloadRefundEvidence(evidenceId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: (error) => this.notificationService.error(getApiErrorMessage(error, 'No se pudo abrir el comprobante privado.')),
    });
  }

  confirmRefund(): void {
    const refund = this.refund();
    if (!refund || !confirm('Confirma únicamente si el dinero ya llegó a tu cuenta.')) return;
    this.refundSubmitting.set(true);
    this.ordersApi.confirmRefund(refund.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => { this.refund.set(result); this.refundSubmitting.set(false); this.loadOrder(result.orderId); this.notificationService.success('Devolución confirmada.'); },
      error: (error) => { this.refundSubmitting.set(false); this.notificationService.error(getApiErrorMessage(error, 'No se pudo confirmar la devolución.')); },
    });
  }

  disputeRefund(): void {
    const refund = this.refund();
    const reason = prompt('Indica por qué no reconoces la devolución:')?.trim();
    if (!refund || !reason) return;
    this.refundSubmitting.set(true);
    this.ordersApi.disputeRefund(refund.id, reason).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => { this.refund.set(result); this.refundSubmitting.set(false); this.notificationService.warning('El caso pasó a revisión de AppuraPe.'); },
      error: (error) => { this.refundSubmitting.set(false); this.notificationService.error(getApiErrorMessage(error, 'No se pudo abrir la disputa.')); },
    });
  }

  private loadOrder(id: string): void {
    this.ordersApi.getMyOrder(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadFulfillmentOptions(order.id);
        this.loadAddresses();
        if (order.paymentStatus === 'RefundPending' || order.paymentStatus === 'Refunded') this.loadRefund(order.id);
        if (['ReadyForPickup', 'Assigned', 'PickedUp', 'OnTheWay'].includes(order.status)) this.loadDeliveryConfirmation(order.id);
        this.ratingForm.patchValue({ rating: order.driverRating ?? 5, comment: order.driverFeedback ?? '' });
        this.isLoading.set(false);
      },
      error: (error) => {
        const message = getApiErrorMessage(error, 'Revisa si el pedido existe o pertenece a tu cuenta.');
        this.errorMessage.set(message);
        this.notificationService.error(message);
        this.isLoading.set(false);
      },
    });
  }

  private loadRefund(orderId: string): void {
    this.ordersApi.getRefund(orderId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (result) => this.refund.set(result), error: () => this.refund.set(null) });
  }

  regenerateDeliveryCode(): void {
    const order = this.order();
    if (!order || !window.confirm('El código anterior dejará de funcionar. ¿Generar uno nuevo?')) return;
    this.ordersApi.regenerateDeliveryConfirmation(order.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => { this.deliveryConfirmation.set(result); this.notificationService.success('Código regenerado.'); },
      error: (error) => this.notificationService.error(getApiErrorMessage(error, 'No se pudo regenerar el código.')),
    });
  }

  private loadDeliveryConfirmation(orderId: string): void {
    this.ordersApi.getDeliveryConfirmation(orderId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => this.deliveryConfirmation.set(result),
      error: () => this.deliveryConfirmation.set(null),
    });
  }

  private loadAddresses(): void {
    this.addressesApi.getMyAddresses().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses.filter((address) => address.isActive));
        const preferred = addresses.find((address) => address.isDefault && address.isActive) ?? addresses.find((address) => address.isActive);
        if (preferred) this.pickupForm.controls.customerAddressId.setValue(preferred.id);
      },
      error: () => this.addresses.set([]),
    });
  }

  submitRating(): void {
    if (this.ratingForm.invalid || !this.order()) {
      this.ratingForm.markAllAsTouched();
      return;
    }

    const order = this.order()!;
    this.isSubmittingRating.set(true);
    this.ratingMessage.set('');

    this.ordersApi
      .rateDriver(order.id, this.ratingForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.ratingForm.patchValue({
            rating: updatedOrder.driverRating ?? this.ratingForm.controls.rating.value,
            comment: updatedOrder.driverFeedback ?? '',
          });
          this.ratingMessage.set('Gracias. Tu calificación ayuda a mejorar la confianza de la red.');
          this.notificationService.success('Calificación guardada correctamente.');
          this.isSubmittingRating.set(false);
        },
        error: (error) => {
          const message = getApiErrorMessage(error, 'No se pudo guardar la calificación.');
          this.ratingMessage.set(message);
          this.notificationService.error(message);
          this.isSubmittingRating.set(false);
        },
      });
  }

  productImageUrl(imageUrl: string | null | undefined): string {
    return imageUrl?.trim() ? imageUrl : MyOrderDetailPageComponent.PRODUCT_PLACEHOLDER_IMAGE;
  }

  productImageSrcSet(imageUrl: string | null | undefined): string | null {
    return imageUrl?.trim() ? null : null;
  }

  handleProductImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith(MyOrderDetailPageComponent.PRODUCT_PLACEHOLDER_IMAGE)) {
      return;
    }

    image.src = MyOrderDetailPageComponent.PRODUCT_PLACEHOLDER_IMAGE;
    image.srcset = '';
  }

  handleTrackingImageError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image || image.src.endsWith(MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE)) {
      return;
    }

    image.src = MyOrderDetailPageComponent.TRACKING_PLACEHOLDER_IMAGE;
  }

  shortOrderId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  readableStatus(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Accepted: 'Aceptado',
      Preparing: 'En preparación',
      ReadyForPickup: 'Listo para recoger',
      Assigned: 'Repartidor asignado',
      PickedUp: 'En camino',
      Delivered: 'Entregado',
      Cancelled: 'Cancelado',
    };

    return labels[status] ?? status;
  }

  paymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      Cash: 'Efectivo',
      Yape: 'Yape',
      Plin: 'Plin',
      Card: 'Tarjeta',
    };

    return labels[method] ?? method;
  }

  paymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      PendingConfirmation: 'Pendiente de confirmación',
      PendingEvidence: 'Falta comprobante',
      UnderReview: 'En revisión',
      RefundPending: 'Devolución pendiente',
      Paid: 'Pagado',
      Rejected: 'Rechazado',
      Failed: 'Fallido',
      Refunded: 'Reembolsado',
    };

    return labels[status] ?? status;
  }

  refundStatusLabel(status: string): string {
    return ({
      Requested: 'Solicitado',
      AwaitingBusinessRefund: 'Esperando devolución del negocio',
      AwaitingCustomerConfirmation: 'Esperando tu confirmación',
      Completed: 'Completado',
      Disputed: 'En disputa',
      Rejected: 'Rechazado',
      Failed: 'Fallido',
    } as Record<string, string>)[status] ?? status;
  }

  showManualPaymentNotice(): boolean {
    const order = this.order();
    return !!order && ['Yape', 'Plin'].includes(order.paymentMethod) && order.paymentStatus === 'PendingConfirmation';
  }

  onPaymentEvidenceFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.paymentEvidenceFile.set(input.files?.[0] ?? null);
    this.paymentEvidenceError.set('');
  }

  submitPaymentEvidence(): void {
    const order = this.order();
    const file = this.paymentEvidenceFile();
    if (!order || this.paymentEvidenceForm.invalid || !file) {
      this.paymentEvidenceForm.markAllAsTouched();
      this.paymentEvidenceError.set(file ? 'Revisa el número y la fecha del pago.' : 'Adjunta una captura del comprobante.');
      return;
    }
    this.isSubmittingPaymentEvidence.set(true);
    this.paymentEvidenceError.set('');
    const value = this.paymentEvidenceForm.getRawValue();
    this.ordersApi.submitPaymentEvidence(order.id, value.operationNumber, new Date(value.paidAtLocal).toISOString(), order.total, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notificationService.success('Comprobante enviado. El negocio verificará el abono real.');
          this.isSubmittingPaymentEvidence.set(false);
          this.loadOrder(order.id);
        },
        error: (error) => {
          this.paymentEvidenceError.set(getApiErrorMessage(error, 'No pudimos enviar el comprobante.'));
          this.isSubmittingPaymentEvidence.set(false);
        },
      });
  }

  trackingStateIcon(key: string) {
    switch (key) {
      case 'Delivered':
        return this.ticketIcon;
      case 'PickedUp':
      case 'OnTheWay':
        return this.truckIcon;
      default:
        return this.packageIcon;
    }
  }

  private findTrackingState(key: (typeof this.trackingStates)[number]['key']) {
    return this.trackingStates.find((state) => state.key === key) ?? this.trackingStates[0];
  }
}

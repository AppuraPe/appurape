import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ArrowLeft,
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
import { CustomerOrderDetailResponse } from '../../core/models/orders.models';
import { NotificationService } from '../../core/services/notification.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { getApiErrorMessage, hasText } from '../../core/utils/api-utils';

@Component({
  selector: 'app-my-order-detail-page',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe, LucideAngularModule],
  templateUrl: './my-order-detail-page.component.html',
})
export class MyOrderDetailPageComponent {
  private readonly trackingStates = [
    {
      key: 'Created',
      label: 'Creado',
      description: 'Tu pedido fue registrado correctamente y ya se encuentra en cola para ser atendido.',
      gifUrl: '/img/pedido-enviado.gif',
    },
    {
      key: 'Accepted',
      label: 'Aceptado',
      description: 'El restaurante confirmo tu pedido y ya empezo a organizar la preparacion.',
      gifUrl: '/img/cocinando-2.gif',
    },
    {
      key: 'Preparing',
      label: 'En preparacion',
      description: 'La cocina esta trabajando en tu pedido para dejarlo listo cuanto antes.',
      gifUrl: '/img/cocinando-2.gif',
    },
    {
      key: 'ReadyForPickup',
      label: 'Listo para recoger',
      description: 'El pedido ya esta empaquetado y esperando la siguiente etapa del envio.',
      gifUrl: '/img/chamo-afuera.gif',
    },
    {
      key: 'Assigned',
      label: 'Repartidor asignado',
      description: 'Ya encontramos quien llevara tu pedido y se esta coordinando la salida.',
      gifUrl: '/img/chamo-afuera.gif',
    },
    {
      key: 'PickedUp',
      label: 'Recogido',
      description: 'El pedido salio del restaurante y va rumbo a tu direccion.',
      gifUrl: '/img/encamino.gif',
    },
    {
      key: 'OnTheWay',
      label: 'En camino',
      description: 'Tu pedido ya esta en ruta y falta poco para que llegue.',
      gifUrl: '/img/encamino.gif',
    },
    {
      key: 'Delivered',
      label: 'Entregado',
      description: 'El pedido fue entregado. Esperamos que disfrutes tu comida.',
      gifUrl: '/img/entregado.gif',
    },
  ] as const;

  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<CustomerOrderDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly trackingMode = signal<'current' | 'history'>('current');
  readonly hasText = hasText;
  readonly arrowLeftIcon = ArrowLeft;
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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const created = this.route.snapshot.queryParamMap.get('created');

    if (created === '1') {
      this.notificationService.success('Tu pedido fue enviado al restaurante. Ahora puedes seguir su estado aqui.');
    }

    if (!id) {
      const message = 'No se encontro el pedido solicitado.';
      this.errorMessage.set(message);
      this.notificationService.error(message);
      this.isLoading.set(false);
      return;
    }

    this.ordersApi
      .getMyOrder(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
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

  toggleTrackingMode(): void {
    this.trackingMode.update((mode) => (mode === 'current' ? 'history' : 'current'));
  }

  trackingButtonLabel(): string {
    return this.trackingMode() === 'current' ? 'Historial' : 'Cambiar';
  }

  productImageUrl(imageUrl: string | null | undefined): string {
    return imageUrl?.trim() ? imageUrl : '/img/banner1.png';
  }

  productImageSrcSet(imageUrl: string | null | undefined): string | null {
    return imageUrl?.trim() ? null : '/img/banner-mb.png 767w, /img/banner1.png 1280w';
  }

  shortOrderId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  readableStatus(status: string): string {
    const labels: Record<string, string> = {
      Pending: 'Pendiente',
      Accepted: 'Aceptado',
      Preparing: 'En preparacion',
      ReadyForPickup: 'Listo para recoger',
      Assigned: 'Repartidor asignado',
      PickedUp: 'En camino',
      Delivered: 'Entregado',
      Cancelled: 'Cancelado',
    };

    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      Pending: 'bg-accent-500/15 text-accent-600',
      Accepted: 'bg-loreto-rio/15 text-loreto-rio',
      Preparing: 'bg-loreto-rio/15 text-loreto-rio',
      ReadyForPickup: 'bg-loreto-hoja/20 text-loreto-verde',
      Assigned: 'bg-loreto-rio/15 text-loreto-rio',
      PickedUp: 'bg-loreto-rio/15 text-loreto-rio',
      Delivered: 'bg-loreto-hoja/20 text-loreto-verde',
      Cancelled: 'bg-primary-100 text-primary-700',
    };

    return classes[status] ?? 'bg-primary-50 text-loreto-carbon';
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

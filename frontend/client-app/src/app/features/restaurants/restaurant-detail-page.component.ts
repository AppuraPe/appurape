import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CreateOrderRequest, PaymentMethod } from '../../core/models/orders.models';
import { MenuItemResponse, PublicMenuResponse, RestaurantDetailResponse } from '../../core/models/restaurants.models';
import { AuthService } from '../../core/services/auth.service';
import { OrdersApiService } from '../../core/services/orders-api.service';
import { RestaurantsApiService } from '../../core/services/restaurants-api.service';
import { formatTimeSpan, getApiErrorMessage, hasText } from '../../core/utils/api-utils';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

@Component({
  selector: 'app-restaurant-detail-page',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, CurrencyPipe, ReactiveFormsModule],
  template: `
    <section class="page-shell main-stack">
      @if (errorMessage()) {
        <div class="alert error">
          <strong class="alert-title">No pudimos abrir este restaurante</strong>
          <span>{{ errorMessage() }}</span>
          <div class="button-row" style="margin-top: 0.75rem;">
            <a class="button ghost" routerLink="/restaurants">Volver a restaurantes</a>
          </div>
        </div>
      } @else if (isLoading()) {
        <div class="app-card loading-state">
          <span class="eyebrow">Cargando restaurante</span>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
        </div>
      } @else if (restaurant()) {
        <div class="hero-card">
          <app-page-header eyebrow="Restaurante" [title]="restaurant()!.name" [subtitle]="restaurantSubtitle()" />

          <div class="meta-grid">
            @if (hasText(restaurant()!.zoneName)) {
              <div class="meta-item">
                <span>Zona</span>
                <strong>{{ restaurant()!.zoneName }}</strong>
              </div>
            }
            <div class="meta-item">
              <span>Horario</span>
              <strong>{{ formatSchedule(restaurant()!.openTime, restaurant()!.closeTime) }}</strong>
            </div>
            <div class="meta-item">
              <span>Estado</span>
              <strong>{{ restaurant()!.isActive ? 'Activo' : 'No activo' }}</strong>
            </div>
          </div>
        </div>

        <div class="content-layout">
          <div class="main-stack">
            <div class="section-heading">
              <div>
                <h2>Menu</h2>
                <p class="muted">Elige productos disponibles y revisa tu resumen antes de crear el pedido.</p>
              </div>
              <a class="button ghost" routerLink="/restaurants">Cambiar restaurante</a>
            </div>

            @if (!menu()?.categories?.length) {
              <div class="empty-state">
                <div class="empty-state-icon">M</div>
                <h2>Este restaurante aun no tiene menu visible</h2>
                <p class="muted">Cuando publique categorias e items disponibles, apareceran aqui para pedir.</p>
              </div>
            } @else {
              <div class="list">
                @for (category of menu()!.categories; track category.id) {
                  <article class="app-card menu-category">
                    <div class="section-heading">
                      <div>
                        <span class="eyebrow">Categoria</span>
                        <h2 style="margin-top: 0.65rem;">{{ category.name }}</h2>
                        <p class="muted">{{ category.items.length }} producto(s)</p>
                      </div>
                    </div>

                    @if (!category.items.length) {
                      <div class="alert info">
                        <strong class="alert-title">Categoria sin productos</strong>
                        <span>Este grupo aun no tiene items visibles para pedir.</span>
                      </div>
                    } @else {
                      <div class="list">
                        @for (item of category.items; track item.id) {
                          <div class="menu-item" [class.unavailable]="!item.isAvailable">
                            <div class="item-row">
                              <div>
                                <h3>{{ item.name }}</h3>
                                <p class="muted" style="margin-top: 0.35rem;">{{ item.description || 'Sin descripcion disponible.' }}</p>
                              </div>
                              <div style="text-align: right;">
                                <div class="price">{{ item.price | currency: 'PEN' : 'symbol' : '1.2-2' }}</div>
                                <span class="badge" [class.success]="item.isAvailable" [class.danger]="!item.isAvailable">
                                  {{ item.isAvailable ? 'Disponible' : 'No disponible' }}
                                </span>
                              </div>
                            </div>

                            @if (item.isAvailable) {
                              <div class="button-row">
                                <button class="button secondary primary-action" type="button" (click)="addItem(item)">Agregar al pedido</button>
                                @if (getItemQuantity(item.id) > 0) {
                                  <span class="badge info">{{ getItemQuantity(item.id) }} en tu pedido</span>
                                }
                              </div>
                            } @else {
                              <div class="alert warning">
                                <strong class="alert-title">Producto pausado</strong>
                                <span>Este producto no se puede agregar al pedido por ahora.</span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </article>
                }
              </div>
            }
          </div>

          <aside id="checkout" class="app-card order-summary sticky-panel">
            <app-page-header
              eyebrow="Tu pedido"
              title="Resumen y entrega"
              subtitle="Revisa productos, direccion y metodo de pago antes de enviar."
            />

            @if (recentlyAddedMessage()) {
              <div class="alert success" style="margin-bottom: 1rem;">
                <strong class="alert-title">Producto agregado</strong>
                <span>{{ recentlyAddedMessage() }}</span>
              </div>
            }

            <div class="stats-grid">
              <div class="stat-card">
                <span>Productos</span>
                <strong>{{ totalQuantity() }}</strong>
              </div>
              <div class="stat-card">
                <span>Subtotal</span>
                <strong>{{ subtotal() | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
              </div>
            </div>

            <div class="alert info" style="margin-top: 1rem;">
              <strong class="alert-title">Total validado al final</strong>
              <span>El backend confirma delivery, disponibilidad y monto final cuando creas el pedido.</span>
            </div>

            <div style="margin-top: 1.25rem;">
              <div class="section-heading">
                <div>
                  <h2>Productos</h2>
                  <p class="muted">Puedes ajustar cantidades antes de enviar.</p>
                </div>
              </div>

              @if (!cartItems().length) {
                <div class="empty-state">
                  <div class="empty-state-icon">+</div>
                  <h3>Aun no agregaste productos</h3>
                  <p class="muted">Elige un producto del menu para activar el checkout.</p>
                </div>
              } @else {
                <div class="list">
                  @for (item of cartItems(); track item.menuItemId) {
                    <div class="cart-line">
                      <div class="item-row">
                        <div>
                          <h3>{{ item.name }}</h3>
                          <p class="muted">{{ item.price | currency: 'PEN' : 'symbol' : '1.2-2' }} c/u</p>
                        </div>
                        <strong class="price">{{ item.price * item.quantity | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
                      </div>

                      <div class="button-row" style="justify-content: space-between; margin-top: 0.9rem;">
                        <div class="quantity-controls">
                          <button class="button ghost icon-button" type="button" aria-label="Disminuir cantidad" (click)="decrementItem(item.menuItemId)">-</button>
                          <span class="quantity-value">{{ item.quantity }}</span>
                          <button class="button ghost icon-button" type="button" aria-label="Aumentar cantidad" (click)="incrementItem(item.menuItemId)">+</button>
                        </div>
                        <button class="button subtle" type="button" (click)="removeItem(item.menuItemId)">Quitar</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <form class="form-grid" style="margin-top: 1.25rem;" [formGroup]="checkoutForm" (ngSubmit)="submitOrder()">
              <div class="section-heading" style="margin-bottom: 0;">
                <div>
                  <h2>Entrega</h2>
                  <p class="muted">Estos datos son obligatorios para crear el pedido.</p>
                </div>
              </div>

              <div class="field">
                <label for="deliveryAddress">Direccion de entrega</label>
                <input
                  id="deliveryAddress"
                  type="text"
                  formControlName="deliveryAddress"
                  placeholder="Av., calle o ubicacion exacta"
                />
                @if (checkoutForm.controls.deliveryAddress.invalid && checkoutForm.controls.deliveryAddress.touched) {
                  <span class="field-error">Necesitamos tu direccion para enviar el pedido.</span>
                }
              </div>

              <div class="field">
                <label for="deliveryReference">Referencia</label>
                <input
                  id="deliveryReference"
                  type="text"
                  formControlName="deliveryReference"
                  placeholder="Puerta, piso, negocio cercano"
                />
                @if (checkoutForm.controls.deliveryReference.invalid && checkoutForm.controls.deliveryReference.touched) {
                  <span class="field-error">Agrega una referencia para ubicarte mejor.</span>
                }
              </div>

              <div class="field">
                <label for="paymentMethod">Metodo de pago</label>
                <select id="paymentMethod" formControlName="paymentMethod">
                  @for (method of paymentMethods; track method) {
                    <option [value]="method">{{ method }}</option>
                  }
                </select>
                <span class="field-hint">No se cobra en linea todavia; solo registramos el metodo elegido.</span>
              </div>

              <div class="field">
                <label for="notes">Notas opcionales</label>
                <textarea
                  id="notes"
                  rows="3"
                  formControlName="notes"
                  placeholder="Indicaciones para cocina o entrega"
                ></textarea>
              </div>

              @if (checkoutErrorMessage()) {
                <div class="alert error">
                  <strong class="alert-title">No pudimos crear el pedido</strong>
                  <span>{{ checkoutErrorMessage() }}</span>
                </div>
              }

              @if (!isAuthenticated()) {
                <div class="alert warning">
                  <strong class="alert-title">Inicia sesion para continuar</strong>
                  <span>Tu pedido esta listo, pero necesitas entrar a tu cuenta para enviarlo al restaurante.</span>
                </div>
              }

              <button class="button full primary-action" type="submit" [disabled]="submitDisabled()">
                {{ submitButtonLabel() }}
              </button>
            </form>
          </aside>
        </div>

        @if (cartItems().length) {
          <div class="mobile-cart-bar" aria-label="Resumen movil del pedido">
            <div class="mobile-cart-bar__summary">
              <div>
                <span>Tu pedido</span>
                <strong>{{ totalQuantity() }} producto(s)</strong>
              </div>
              <strong>{{ subtotal() | currency: 'PEN' : 'symbol' : '1.2-2' }}</strong>
            </div>
            <a class="button primary-action" href="#checkout">Revisar y crear pedido</a>
          </div>
        }
      }
    </section>
  `,
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
  readonly hasText = hasText;
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

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
  readonly submitDisabled = computed(() => this.isSubmittingOrder() || !this.cartItems().length);
  readonly submitButtonLabel = computed(() => {
    if (this.isSubmittingOrder()) {
      return 'Enviando pedido...';
    }

    return this.isAuthenticated() ? 'Crear pedido' : 'Iniciar sesion para pedir';
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');

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
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

export type BusinessCartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
};

type CartItemInput = {
  id: string;
  name: string;
  price: number;
};

type AddItemFromBusinessInput = {
  businessId: string;
  businessName: string;
  item: CartItemInput;
  quantity?: number;
};

type SyncBusinessCartInput = {
  businessId: string;
  businessName: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
};

type PendingBusinessChange = {
  currentBusinessId: string;
  currentBusinessName: string;
  nextBusinessId: string;
  nextBusinessName: string;
  item: CartItemInput;
  quantity: number;
};

type PersistedBusinessCart = {
  businessId: string;
  businessName: string;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
};

@Injectable({ providedIn: 'root' })
export class BusinessCartService {
  private static readonly STORAGE_KEY = 'appurape.business-cart.v1';
  private readonly notificationService = inject(NotificationService);

  readonly activeBusinessId = signal('');
  readonly activeBusinessName = signal('');
  readonly cartState = signal<Record<string, BusinessCartLine>>({});
  readonly pendingBusinessChange = signal<PendingBusinessChange | null>(null);
  readonly cartItems = computed(() =>
    Object.values(this.cartState()).sort((left, right) => left.name.localeCompare(right.name)),
  );
  readonly totalQuantity = computed(() =>
    this.cartItems().reduce((total, item) => total + item.quantity, 0),
  );
  readonly subtotal = computed(() =>
    this.cartItems().reduce((total, item) => total + item.price * item.quantity, 0),
  );

  constructor() {
    this.restorePersistedCart();
  }

  setBusinessContext(businessId: string, businessName = ''): void {
    if (!businessId || this.cartItems().length) {
      return;
    }

    this.activeBusinessId.set(businessId);
    this.activeBusinessName.set(businessName.trim());
  }

  addItemFromBusiness({ businessId, businessName, item, quantity = 1 }: AddItemFromBusinessInput): boolean {
    const nextBusinessId = businessId.trim();
    const nextBusinessName = businessName.trim();

    if (!nextBusinessId || quantity <= 0) {
      return false;
    }

    const currentBusinessId = this.activeBusinessId().trim();
    const hasCartItems = this.cartItems().length > 0;

    if (hasCartItems && currentBusinessId && currentBusinessId !== nextBusinessId) {
      this.pendingBusinessChange.set({
        currentBusinessId,
        currentBusinessName: this.activeBusinessName().trim() || 'tu negocio actual',
        nextBusinessId,
        nextBusinessName: nextBusinessName || 'el nuevo negocio',
        item,
        quantity,
      });
      return false;
    }

    this.pendingBusinessChange.set(null);
    this.activeBusinessId.set(nextBusinessId);
    this.activeBusinessName.set(nextBusinessName);
    this.addItem(item, quantity);
    return true;
  }

  cancelPendingBusinessChange(): void {
    this.pendingBusinessChange.set(null);
  }

  confirmPendingBusinessChange(): boolean {
    const pendingChange = this.pendingBusinessChange();

    if (!pendingChange) {
      return false;
    }

    this.clear();
    this.activeBusinessId.set(pendingChange.nextBusinessId);
    this.activeBusinessName.set(pendingChange.nextBusinessName);
    this.addItem(pendingChange.item, pendingChange.quantity);
    this.pendingBusinessChange.set(null);
    this.persistCart();
    this.notificationService.success('Carrito reemplazado correctamente.');
    return true;
  }

  syncValidatedCart({ businessId, businessName, items }: SyncBusinessCartInput): void {
    const nextBusinessId = businessId.trim();

    if (!nextBusinessId || !items.length) {
      this.clear();
      return;
    }

    this.activeBusinessId.set(nextBusinessId);
    this.activeBusinessName.set(businessName.trim());
    this.cartState.set(
      items.reduce<Record<string, BusinessCartLine>>((nextState, item) => {
        if (!item.menuItemId.trim() || !item.name.trim() || item.quantity <= 0 || item.price < 0) {
          return nextState;
        }

        nextState[item.menuItemId] = {
          menuItemId: item.menuItemId.trim(),
          name: item.name.trim(),
          price: item.price,
          quantity: item.quantity,
        };
        return nextState;
      }, {}),
    );
    this.persistCart();
  }

  addItem(item: CartItemInput, quantity = 1): void {
    if (quantity <= 0) {
      return;
    }

    this.cartState.update((currentState) => {
      const currentLine = currentState[item.id];
      const nextQuantity = (currentLine?.quantity ?? 0) + quantity;

      return {
        ...currentState,
        [item.id]: {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: nextQuantity,
        },
      };
    });
    this.persistCart();
  }

  incrementItem(menuItemId: string): void {
    const cartLine = this.cartState()[menuItemId];

    if (!cartLine) {
      return;
    }

    this.addItem({ id: cartLine.menuItemId, name: cartLine.name, price: cartLine.price });
    this.notificationService.success('Carrito actualizado.');
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
    this.persistCart();
    this.notificationService.success('Carrito actualizado.');
  }

  removeItem(menuItemId: string): void {
    this.cartState.update((currentState) => {
      if (!currentState[menuItemId]) {
        return currentState;
      }

      const nextState = { ...currentState };
      delete nextState[menuItemId];
      return nextState;
    });

    if (!this.cartItems().length) {
      this.activeBusinessId.set('');
      this.activeBusinessName.set('');
    }

    this.persistCart();
    this.notificationService.info('Producto eliminado del carrito.');
  }

  getItemQuantity(menuItemId: string): number {
    return this.cartState()[menuItemId]?.quantity ?? 0;
  }

  clear(): void {
    this.cartState.set({});
    this.activeBusinessId.set('');
    this.activeBusinessName.set('');
    this.pendingBusinessChange.set(null);
    this.clearPersistedCart();
  }

  clearPersistedCart(): void {
    try {
      localStorage.removeItem(BusinessCartService.STORAGE_KEY);
    } catch {
      // Ignore storage failures and keep the in-memory cart usable.
    }
  }

  private persistCart(): void {
    const items = this.cartItems();
    const businessId = this.activeBusinessId().trim();

    if (!items.length || !businessId) {
      this.clearPersistedCart();
      return;
    }

    const payload: PersistedBusinessCart = {
      businessId,
      businessName: this.activeBusinessName().trim(),
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    };

    try {
      localStorage.setItem(BusinessCartService.STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures and keep the in-memory cart usable.
    }
  }

  private restorePersistedCart(): void {
    let rawValue: string | null = null;

    try {
      rawValue = localStorage.getItem(BusinessCartService.STORAGE_KEY);
    } catch {
      return;
    }

    if (!rawValue) {
      return;
    }

    let parsedValue: unknown;

    try {
      parsedValue = JSON.parse(rawValue);
    } catch {
      this.clearPersistedCart();
      return;
    }

    const restoredCart = this.parsePersistedCart(parsedValue);

    if (!restoredCart) {
      this.clearPersistedCart();
      return;
    }

    this.activeBusinessId.set(restoredCart.businessId);
    this.activeBusinessName.set(restoredCart.businessName);
    this.cartState.set(
      restoredCart.items.reduce<Record<string, BusinessCartLine>>((nextState, item) => {
        nextState[item.menuItemId] = {
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        };

        return nextState;
      }, {}),
    );
  }

  private parsePersistedCart(value: unknown): PersistedBusinessCart | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as Partial<PersistedBusinessCart>;

    if (typeof candidate.businessId !== 'string' || !candidate.businessId.trim()) {
      return null;
    }

    if (typeof candidate.businessName !== 'string') {
      return null;
    }

    if (!Array.isArray(candidate.items) || !candidate.items.length) {
      return null;
    }

    const parsedItems = candidate.items
      .map((item) => this.parsePersistedLine(item))
      .filter((item): item is BusinessCartLine => item !== null);

    if (!parsedItems.length) {
      return null;
    }

    return {
      businessId: candidate.businessId.trim(),
      businessName: candidate.businessName.trim(),
      items: parsedItems,
    };
  }

  private parsePersistedLine(value: unknown): BusinessCartLine | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const candidate = value as Partial<BusinessCartLine>;

    if (typeof candidate.menuItemId !== 'string' || !candidate.menuItemId.trim()) {
      return null;
    }

    if (typeof candidate.name !== 'string' || !candidate.name.trim()) {
      return null;
    }

    if (typeof candidate.price !== 'number' || !Number.isFinite(candidate.price) || candidate.price < 0) {
      return null;
    }

    if (
      typeof candidate.quantity !== 'number' ||
      !Number.isInteger(candidate.quantity) ||
      candidate.quantity <= 0
    ) {
      return null;
    }

    return {
      menuItemId: candidate.menuItemId.trim(),
      name: candidate.name.trim(),
      price: candidate.price,
      quantity: candidate.quantity,
    };
  }
}

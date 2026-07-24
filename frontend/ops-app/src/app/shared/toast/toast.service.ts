import { Injectable, signal } from '@angular/core';
import { ToastMessage, ToastType } from './toast.types';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private static readonly DEFAULT_DURATION_MS = 3000;
  private static readonly MAX_VISIBLE_TOASTS = 2;
  private static readonly DUPLICATE_WINDOW_MS = 500;

  private nextId = 1;
  private readonly timeoutIds = new Map<number, ReturnType<typeof setTimeout>>();
  private lastToastKey = '';
  private lastToastAt = 0;
  private readonly toastsState = signal<ToastMessage[]>([]);

  readonly toasts = this.toastsState.asReadonly();

  success(message: string, durationMs?: number): void {
    this.show('success', message, durationMs);
  }

  error(message: string, durationMs?: number): void {
    this.show('error', message, durationMs);
  }

  warning(message: string, durationMs?: number): void {
    this.show('warning', message, durationMs);
  }

  info(message: string, durationMs?: number): void {
    this.show('info', message, durationMs);
  }

  dismiss(id: number): void {
    this.clearTimeoutFor(id);
    this.toastsState.update((current) => current.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const id of this.timeoutIds.keys()) {
      this.clearTimeoutFor(id);
    }

    this.toastsState.set([]);
  }

  private show(type: ToastType, rawMessage: string, durationMs?: number): void {
    const message = rawMessage.trim();

    if (!message) {
      return;
    }

    const now = Date.now();
    const key = `${type}:${message}`;

    if (this.lastToastKey === key && now - this.lastToastAt < ToastService.DUPLICATE_WINDOW_MS) {
      return;
    }

    this.lastToastKey = key;
    this.lastToastAt = now;

    const toast: ToastMessage = {
      id: this.nextId++,
      type,
      message,
      durationMs: durationMs ?? ToastService.DEFAULT_DURATION_MS,
    };

    this.toastsState.update((current) => {
      const next = [...current, toast];

      while (next.length > ToastService.MAX_VISIBLE_TOASTS) {
        const removed = next.shift();

        if (removed) {
          this.clearTimeoutFor(removed.id);
        }
      }

      return next;
    });

    this.timeoutIds.set(
      toast.id,
      setTimeout(() => {
        this.dismiss(toast.id);
      }, toast.durationMs),
    );
  }

  private clearTimeoutFor(id: number): void {
    const timeoutId = this.timeoutIds.get(id);

    if (!timeoutId) {
      return;
    }

    clearTimeout(timeoutId);
    this.timeoutIds.delete(id);
  }
}

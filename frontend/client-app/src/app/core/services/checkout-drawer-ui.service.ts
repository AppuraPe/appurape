import { DOCUMENT } from '@angular/common';
import { Injectable, TemplateRef, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CheckoutDrawerUiService {
  private readonly document = inject(DOCUMENT);
  private previousBodyOverflow = '';

  readonly drawerTemplate = signal<TemplateRef<unknown> | null>(null);
  readonly drawerContext = signal<object | null>(null);
  readonly isOpen = signal(false);

  register(template: TemplateRef<unknown>, context: object): void {
    this.drawerTemplate.set(template);
    this.drawerContext.set(context);
  }

  unregister(): void {
    this.close();
    this.drawerTemplate.set(null);
    this.drawerContext.set(null);
  }

  open(): void {
    if (this.isOpen()) {
      return;
    }

    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
    this.isOpen.set(true);
  }

  close(): void {
    if (!this.isOpen()) {
      return;
    }

    this.document.body.style.overflow = this.previousBodyOverflow;
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
      return;
    }

    this.open();
  }
}

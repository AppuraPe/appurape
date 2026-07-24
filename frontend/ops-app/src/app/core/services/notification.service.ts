import { Injectable, inject } from '@angular/core';
import { ToastService } from '../../shared/toast/toast.service';

type NotifyOptions = {
  description?: string;
  duration?: number;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly defaultDuration = 3000;
  private readonly toastService = inject(ToastService);

  success(message: string, options?: NotifyOptions): void {
    this.toastService.success(this.resolveMessage(message, options?.description), options?.duration ?? this.defaultDuration);
  }

  error(message: string, options?: NotifyOptions): void {
    this.toastService.error(this.resolveMessage(message, options?.description), options?.duration ?? this.defaultDuration);
  }

  info(message: string, options?: NotifyOptions): void {
    this.toastService.info(this.resolveMessage(message, options?.description), options?.duration ?? this.defaultDuration);
  }

  warning(message: string, options?: NotifyOptions): void {
    this.toastService.warning(this.resolveMessage(message, options?.description), options?.duration ?? this.defaultDuration);
  }

  private resolveMessage(message: string, description?: string): string {
    return description?.trim() ? `${message} ${description}` : message;
  }
}

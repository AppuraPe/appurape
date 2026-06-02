import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

type NotifyOptions = {
  description?: string;
  duration?: number;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly defaultDuration = 4200;

  success(message: string, options?: NotifyOptions): void {
    toast.success(message, {
      description: options?.description,
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  error(message: string, options?: NotifyOptions): void {
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  info(message: string, options?: NotifyOptions): void {
    toast.info(message, {
      description: options?.description,
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  warning(message: string, options?: NotifyOptions): void {
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration ?? this.defaultDuration,
    });
  }
}

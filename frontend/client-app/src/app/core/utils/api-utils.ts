import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type ApiValidationError = {
  error?: unknown;
  field?: unknown;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: ApiValidationError[];
};

export function buildApiUrl(path: string): string {
  const normalizedBaseUrl = environment.apiBaseUrl.trim().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedBaseUrl ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No se pudo conectar con el backend.';
    }

    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error.error && typeof error.error === 'object') {
      const payload = error.error as ApiErrorPayload;

      if (typeof payload.message === 'string' && payload.message.trim()) {
        return payload.message;
      }

      const firstValidationError = payload.errors?.find(
        (validationError) => typeof validationError.error === 'string' && validationError.error.trim(),
      );

      if (typeof firstValidationError?.error === 'string') {
        return firstValidationError.error;
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }
  }

  return fallback;
}

export function formatTimeSpan(value: string | null | undefined): string {
  if (!value) {
    return 'No disponible';
  }

  const [hours = '00', minutes = '00'] = value.split(':');
  return `${hours}:${minutes}`;
}

export function hasText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

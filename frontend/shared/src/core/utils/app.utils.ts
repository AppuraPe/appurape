type ApiValidationError = {
  error?: unknown;
  field?: unknown;
};

type ApiErrorPayload = {
  message?: unknown;
  errors?: ApiValidationError[] | Record<string, unknown> | string;
  error?: unknown;
};

type ErrorLike = {
  status?: number;
  error?: unknown;
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const candidate = error as ErrorLike;

  if (candidate && typeof candidate.status === 'number' && candidate.status === 0) {
    return 'No se pudo conectar con el backend.';
  }

  if (candidate && typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  if (candidate && candidate.error && typeof candidate.error === 'object') {
    const payload = candidate.error as ApiErrorPayload;

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }

    if (Array.isArray(payload.errors)) {
      const firstValidationError = payload.errors.find(
        (validationError) => typeof validationError.error === 'string' && validationError.error.trim(),
      );

      if (typeof firstValidationError?.error === 'string' && firstValidationError.error.trim()) {
        return firstValidationError.error;
      }
    } else if (typeof payload.errors === 'string' && payload.errors.trim()) {
      return payload.errors;
    } else if (payload.errors && typeof payload.errors === 'object') {
      const objectErrors = Object.values(payload.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .find((value) => typeof value === 'string' && value.trim());

      if (typeof objectErrors === 'string' && objectErrors.trim()) {
        return objectErrors;
      }
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
  }

  if (candidate && typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message;
  }

  return fallback;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const candidate = error as {
    error?:
      | {
          message?: string;
          title?: string;
          error?: string;
          errors?: Record<string, string[] | string> | string[];
        }
      | string;
    message?: string;
  };

  if (typeof candidate?.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  if (candidate?.error && typeof candidate.error === 'object') {
    const { message, title, error: rootError, errors } = candidate.error;

    if (message) {
      return message;
    }

    if (typeof rootError === 'string' && rootError.trim()) {
      return rootError;
    }

    if (title) {
      if (title.includes('validation errors occurred') && errors) {
        const validationMessage = readValidationMessage(errors);
        if (validationMessage) {
          return validationMessage;
        }
      }

      return title;
    }

    const validationMessage = errors ? readValidationMessage(errors) : null;

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (candidate?.message) {
    return candidate.message;
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

export function buildApiUrl(path: string, baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedBaseUrl ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath;
}

function readValidationMessage(errors: Record<string, string[] | string> | string[]): string | null {
  if (Array.isArray(errors)) {
    const firstArrayMessage = errors.find((item) => typeof item === 'string' && item.trim());
    return firstArrayMessage ?? null;
  }

  for (const value of Object.values(errors)) {
    const messages = Array.isArray(value) ? value : [value];

    for (const message of messages) {
      if (typeof message !== 'string' || !message.trim()) {
        continue;
      }

      if (message.includes('could not be converted to') && message.includes('OrderStatus')) {
        return 'No se pudo actualizar el estado del pedido. El valor enviado no coincide con el contrato esperado.';
      }

      return message;
    }
  }

  return null;
}

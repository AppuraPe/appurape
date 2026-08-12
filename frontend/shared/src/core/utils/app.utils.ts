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
  const statusMessage = getStatusMessage(candidate?.status);

  if (statusMessage) {
    return statusMessage;
  }

  if (candidate && isSafeUserMessage(candidate.error)) {
    return candidate.error;
  }

  if (candidate && candidate.error && typeof candidate.error === 'object') {
    const payload = candidate.error as ApiErrorPayload;

    if (isSafeUserMessage(payload.message)) {
      return payload.message;
    }

    if (Array.isArray(payload.errors)) {
      const firstValidationError = payload.errors.find(
        (validationError) => typeof validationError.error === 'string' && validationError.error.trim(),
      );

      if (isSafeUserMessage(firstValidationError?.error)) {
        return firstValidationError.error;
      }
    } else if (isSafeUserMessage(payload.errors)) {
      return payload.errors;
    } else if (payload.errors && typeof payload.errors === 'object') {
      const objectErrors = Object.values(payload.errors)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .find((value) => typeof value === 'string' && value.trim());

      if (isSafeUserMessage(objectErrors)) {
        return objectErrors;
      }
    }

    if (isSafeUserMessage(payload.error)) {
      return payload.error;
    }
  }

  if (candidate && isSafeUserMessage(candidate.message)) {
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
    status?: number;
  };
  const statusMessage = getStatusMessage(candidate?.status);

  if (statusMessage) {
    return statusMessage;
  }

  if (isSafeUserMessage(candidate?.error)) {
    return candidate.error;
  }

  if (candidate?.error && typeof candidate.error === 'object') {
    const { message, title, error: rootError, errors } = candidate.error;

    if (isSafeUserMessage(message)) {
      return message;
    }

    if (isSafeUserMessage(rootError)) {
      return rootError;
    }

    if (isSafeUserMessage(title)) {
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

  if (isSafeUserMessage(candidate?.message)) {
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
    const firstArrayMessage = errors.find((item) => isSafeUserMessage(item));
    return firstArrayMessage ?? null;
  }

  for (const value of Object.values(errors)) {
    const messages = Array.isArray(value) ? value : [value];

    for (const message of messages) {
      if (!isSafeUserMessage(message)) {
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

function getStatusMessage(status: number | undefined): string | null {
  switch (status) {
    case 0:
      return 'No pudimos conectarnos. Revisa tu internet e intenta nuevamente.';
    case 401:
      return 'Tu sesión ha vencido. Inicia sesión nuevamente para continuar.';
    case 403:
      return 'No tienes permiso para realizar esta acción. Usa una cuenta adecuada o vuelve a iniciar sesión.';
    case 404:
      return 'No encontramos la información solicitada.';
    default:
      return typeof status === 'number' && status >= 500
        ? 'Ocurrió un problema en el servidor. Intenta más tarde.'
        : null;
  }
}

function isSafeUserMessage(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }

  return !/(http failure response|https?:\/\/|localhost|_capacitor_http_interceptor|\b403\s+(?:ok|forbidden)\b|stack trace)/i.test(
    value,
  );
}

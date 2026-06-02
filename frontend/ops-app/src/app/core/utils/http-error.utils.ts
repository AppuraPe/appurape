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

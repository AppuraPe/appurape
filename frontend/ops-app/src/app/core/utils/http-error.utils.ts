export function getErrorMessage(error: unknown, fallback: string): string {
  const candidate = error as {
    error?: { message?: string; title?: string; errors?: Record<string, string[]> } | string;
    message?: string;
  };

  if (typeof candidate?.error === 'string' && candidate.error.trim()) {
    return candidate.error;
  }

  if (candidate?.error && typeof candidate.error === 'object') {
    const { message, title, errors } = candidate.error;

    if (message) {
      return message;
    }

    if (title) {
      return title;
    }

    const validationMessage = errors
      ? Object.values(errors)
          .flat()
          .find((item) => !!item)
      : null;

    if (validationMessage) {
      return validationMessage;
    }
  }

  if (candidate?.message) {
    return candidate.message;
  }

  return fallback;
}

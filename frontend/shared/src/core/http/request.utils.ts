export function isApiRequest(requestUrl: string, apiBaseUrl: string | null | undefined): boolean {
  const normalizedBaseUrl = apiBaseUrl?.trim().replace(/\/$/, '');

  if (normalizedBaseUrl) {
    return (
      requestUrl.startsWith(normalizedBaseUrl) ||
      requestUrl.startsWith(`${normalizedBaseUrl}/api`) ||
      requestUrl === `${normalizedBaseUrl}/api`
    );
  }

  return requestUrl.startsWith('/api/') || requestUrl === '/api';
}

import { environment } from '../../../environments/environment';

export { getApiErrorMessage, formatTimeSpan, hasText } from '@app/shared/core/utils/app.utils';

export function buildApiUrl(path: string): string {
  const normalizedBaseUrl = environment.apiBaseUrl.trim().replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedBaseUrl ? `${normalizedBaseUrl}${normalizedPath}` : normalizedPath;
}

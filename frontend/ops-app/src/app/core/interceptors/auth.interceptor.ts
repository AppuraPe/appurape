import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { isApiRequest } from '@app/shared/core/http/request.utils';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);
  const token = authService.getToken();
  const apiBaseUrl = environment.apiBaseUrl;

  if (!token || !isApiRequest(request.url, apiBaseUrl) || isAuthRequest(request.url, apiBaseUrl)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ).pipe(
    catchError((error) => {
      if (error?.status === 401 && authService.expireSession()) {
        notificationService.warning('Tu sesión expiró. Inicia sesión nuevamente.');
        void router.navigate(['/login'], {
          queryParams: {
            returnUrl: router.url,
          },
        });
      }

      return throwError(() => error);
    }),
  );
};

function isAuthRequest(requestUrl: string, apiBaseUrl: string | null | undefined): boolean {
  const normalizedBaseUrl = apiBaseUrl?.trim().replace(/\/$/, '');
  const normalizedUrl = requestUrl.trim();

  if (normalizedBaseUrl) {
    return normalizedUrl === `${normalizedBaseUrl}/api/auth` || normalizedUrl.startsWith(`${normalizedBaseUrl}/api/auth/`);
  }

  return normalizedUrl === '/api/auth' || normalizedUrl.startsWith('/api/auth/');
}

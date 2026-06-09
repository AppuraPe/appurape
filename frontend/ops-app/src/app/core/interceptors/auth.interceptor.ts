import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { isApiRequest } from '@app/shared/core/http/request.utils';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const apiBaseUrl = environment.apiBaseUrl;

  if (!token || !isApiRequest(request.url, apiBaseUrl)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};

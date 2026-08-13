import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LegalApiService } from '../services/legal-api.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasValidSession()) {
    if (authService.currentUser()?.status === 'PendingDeletion' && !state.url.startsWith('/account/deletion-pending')) return router.createUrlTree(['/account/deletion-pending']);
    const role = authService.getCurrentRole();
    if (role === 'Admin' || state.url.startsWith('/legal/consent') || state.url.startsWith('/account/deletion')) return true;
    const legalApi = inject(LegalApiService);
    return legalApi.getConsentStatus().pipe(
      map((status) => status.isRequired ? router.createUrlTree(['/legal/consent'], { queryParams: { redirectTo: state.url } }) : true),
      catchError(() => of(true)),
    );
  }

  return router.createUrlTree(['/login'], {
    queryParams: { redirectTo: state.url },
  });
};

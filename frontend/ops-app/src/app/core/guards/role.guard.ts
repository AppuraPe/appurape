import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];
  const currentRole = authService.getCurrentRole();

  if (!authService.hasValidOpsSession()) {
    return router.createUrlTree(['/login']);
  }

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  const fallbackRoute = authService.getDefaultRoute();
  return fallbackRoute === '/login'
    ? router.createUrlTree(['/login'])
    : router.createUrlTree([fallbackRoute]);
};

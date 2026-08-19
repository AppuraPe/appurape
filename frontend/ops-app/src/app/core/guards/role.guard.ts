import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];
  const currentRole = authService.getCurrentRole();

  if (!authService.hasValidSession()) {
    return router.createUrlTree(['/login'], {
      queryParams: { redirectTo: state.url },
    });
  }

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  const defaultRoute = authService.getDefaultRoute(currentRole);
  return router.createUrlTree([defaultRoute]);
};

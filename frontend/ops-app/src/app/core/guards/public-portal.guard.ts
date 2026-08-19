import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isOpsRole } from '@app/shared/core/auth/role.utils';

export const publicPortalGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentRole = authService.getCurrentRole();

  if (authService.isAuthenticated() && isOpsRole(currentRole)) {
    return router.createUrlTree([authService.getDefaultRoute(currentRole)]);
  }

  return true;
};

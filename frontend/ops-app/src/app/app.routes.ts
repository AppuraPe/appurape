import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

const businessOpsChildren: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/business/business-dashboard-page.component').then((m) => m.BusinessDashboardPageComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/business/business-profile-page.component').then((m) => m.BusinessProfilePageComponent),
  },
  {
    path: 'menu/categories',
    loadComponent: () => import('./features/business/business-categories-page.component').then((m) => m.BusinessCategoriesPageComponent),
  },
  {
    path: 'menu/items',
    loadComponent: () => import('./features/business/business-items-page.component').then((m) => m.BusinessItemsPageComponent),
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/business/business-orders-page.component').then((m) => m.BusinessOrdersPageComponent),
  },
];

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/forgot-password-page.component').then((m) => m.ForgotPasswordPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'businesses' },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register-page.component').then((m) => m.RegisterPageComponent),
      },
      {
        path: 'restaurants',
        loadComponent: () => import('./features/businesses/business-list-page.component').then((m) => m.BusinessListPageComponent),
      },
      {
        path: 'businesses',
        loadComponent: () => import('./features/businesses/business-list-page.component').then((m) => m.BusinessListPageComponent),
      },
      {
        path: 'restaurants/:id',
        loadComponent: () => import('./features/businesses/business-detail-page.component').then((m) => m.BusinessDetailPageComponent),
      },
      {
        path: 'businesses/:id',
        loadComponent: () => import('./features/businesses/business-detail-page.component').then((m) => m.BusinessDetailPageComponent),
      },
      {
        path: 'community',
        canActivate: [authGuard],
        loadComponent: () => import('./features/community/community-hub-page.component').then((m) => m.CommunityHubPageComponent),
      },
      {
        path: 'favors',
        canActivate: [authGuard],
        loadComponent: () => import('./features/community/community-hub-page.component').then((m) => m.CommunityHubPageComponent),
      },
      {
        path: 'community/requests/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/community/community-request-detail-page.component').then((m) => m.CommunityRequestDetailPageComponent),
      },
      {
        path: 'favors/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/community/community-request-detail-page.component').then((m) => m.CommunityRequestDetailPageComponent),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/my-orders-page.component').then((m) => m.MyOrdersPageComponent),
      },
      {
        path: 'orders/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/orders/my-order-detail-page.component').then((m) => m.MyOrderDetailPageComponent),
      },
    ],
  },
  {
    path: 'register/restaurant',
    loadComponent: () => import('./features/auth/restaurant-registration-start-page.component').then((m) => m.RestaurantRegistrationStartPageComponent),
  },
  {
    path: 'register/business',
    loadComponent: () => import('./features/auth/restaurant-registration-start-page.component').then((m) => m.RestaurantRegistrationStartPageComponent),
  },
  {
    path: 'register/restaurant/verify',
    loadComponent: () => import('./features/auth/restaurant-registration-verify-page.component').then((m) => m.RestaurantRegistrationVerifyPageComponent),
  },
  {
    path: 'register/business/verify',
    loadComponent: () => import('./features/auth/restaurant-registration-verify-page.component').then((m) => m.RestaurantRegistrationVerifyPageComponent),
  },
  {
    path: 'register/restaurant/complete',
    loadComponent: () => import('./features/auth/restaurant-registration-complete-page.component').then((m) => m.RestaurantRegistrationCompletePageComponent),
  },
  {
    path: 'register/business/complete',
    loadComponent: () => import('./features/auth/restaurant-registration-complete-page.component').then((m) => m.RestaurantRegistrationCompletePageComponent),
  },
  {
    path: 'register/driver',
    loadComponent: () => import('./features/auth/driver-registration-start-page.component').then((m) => m.DriverRegistrationStartPageComponent),
  },
  {
    path: 'register/driver/verify',
    loadComponent: () => import('./features/auth/driver-registration-verify-page.component').then((m) => m.DriverRegistrationVerifyPageComponent),
  },
  {
    path: 'register/driver/complete',
    loadComponent: () => import('./features/auth/driver-registration-complete-page.component').then((m) => m.DriverRegistrationCompletePageComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./features/system/unauthorized-page.component').then((m) => m.UnauthorizedPageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/ops-layout.component').then((m) => m.OpsLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'restaurant',
        canActivate: [roleGuard],
        data: { roles: ['Restaurant'] },
        children: businessOpsChildren,
      },
      {
        path: 'business',
        canActivate: [roleGuard],
        data: { roles: ['Restaurant'] },
        children: businessOpsChildren,
      },
      {
        path: 'driver',
        canActivate: [roleGuard],
        data: { roles: ['Driver'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/driver/driver-dashboard-page.component').then((m) => m.DriverDashboardPageComponent),
          },
          {
            path: 'orders/available',
            loadComponent: () => import('./features/driver/driver-available-orders-page.component').then((m) => m.DriverAvailableOrdersPageComponent),
          },
          {
            path: 'orders/my',
            loadComponent: () => import('./features/driver/driver-my-orders-page.component').then((m) => m.DriverMyOrdersPageComponent),
          },
        ],
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          {
            path: 'dashboard',
            loadComponent: () => import('./features/admin/admin-dashboard-page.component').then((m) => m.AdminDashboardPageComponent),
          },
          {
            path: 'community',
            loadComponent: () => import('./features/admin/admin-community-dashboard-page.component').then((m) => m.AdminCommunityDashboardPageComponent),
          },
          {
            path: 'restaurants/pending',
            loadComponent: () => import('./features/admin/admin-pending-businesses-page.component').then((m) => m.AdminPendingBusinessesPageComponent),
          },
          {
            path: 'restaurants',
            loadComponent: () => import('./features/admin/admin-businesses-page.component').then((m) => m.AdminBusinessesPageComponent),
          },
          {
            path: 'restaurants/:id',
            loadComponent: () => import('./features/admin/admin-business-detail-page.component').then((m) => m.AdminBusinessDetailPageComponent),
          },
          {
            path: 'drivers/pending',
            loadComponent: () => import('./features/admin/admin-pending-drivers-page.component').then((m) => m.AdminPendingDriversPageComponent),
          },
          {
            path: 'drivers',
            loadComponent: () => import('./features/admin/admin-drivers-page.component').then((m) => m.AdminDriversPageComponent),
          },
          {
            path: 'drivers/:id',
            loadComponent: () => import('./features/admin/admin-driver-detail-page.component').then((m) => m.AdminDriverDetailPageComponent),
          },
        ],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./features/system/not-found-page.component').then((m) => m.NotFoundPageComponent),
  },
];

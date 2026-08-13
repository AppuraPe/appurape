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
    path: 'menu/items/new',
    loadComponent: () => import('./features/business/business-item-new-page.component').then((m) => m.BusinessItemNewPageComponent),
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/business/business-orders-page.component').then((m) => m.BusinessOrdersPageComponent),
  },
  {
    path: 'orders/:orderId',
    loadComponent: () => import('./features/business/business-order-detail-page.component').then((m) => m.BusinessOrderDetailPageComponent),
  },
];

export const routes: Routes = [
  {
    path: 'privacy', data: { slug: 'privacy' },
    loadComponent: () => import('./features/legal/legal-document-page.component').then((m) => m.LegalDocumentPageComponent),
  },
  {
    path: 'terms', data: { slug: 'terms' },
    loadComponent: () => import('./features/legal/legal-document-page.component').then((m) => m.LegalDocumentPageComponent),
  },
  {
    path: 'legal/document/:slug',
    loadComponent: () => import('./features/legal/legal-document-page.component').then((m) => m.LegalDocumentPageComponent),
  },
  {
    path: 'legal/consent', canActivate: [authGuard],
    loadComponent: () => import('./features/legal/legal-consent-page.component').then((m) => m.LegalConsentPageComponent),
  },
  {
    path: 'account-deletion',
    loadComponent: () => import('./features/legal/account-deletion-page.component').then((m) => m.AccountDeletionPageComponent),
  },
  {
    path: 'account/deletion-pending', canActivate: [authGuard],
    loadComponent: () => import('./features/legal/account-deletion-pending-page.component').then((m) => m.AccountDeletionPendingPageComponent),
  },
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
        path: 'businesses/:businessId/products/:productId',
        loadComponent: () => import('./features/businesses/business-product-detail-page.component').then((m) => m.BusinessProductDetailPageComponent),
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
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer', 'Driver'] },
        loadComponent: () => import('./features/community/community-hub-page.component').then((m) => m.CommunityHubPageComponent),
      },
      {
        path: 'favors',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer', 'Driver'] },
        loadComponent: () => import('./features/community/community-hub-page.component').then((m) => m.CommunityHubPageComponent),
      },
      {
        path: 'community/requests/:id',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer', 'Driver'] },
        loadComponent: () => import('./features/community/community-request-detail-page.component').then((m) => m.CommunityRequestDetailPageComponent),
      },
      {
        path: 'favors/:id',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer', 'Driver'] },
        loadComponent: () => import('./features/community/community-request-detail-page.component').then((m) => m.CommunityRequestDetailPageComponent),
      },
      {
        path: 'orders',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer'] },
        loadComponent: () => import('./features/orders/my-orders-page.component').then((m) => m.MyOrdersPageComponent),
      },
      {
        path: 'orders/:id',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer'] },
        loadComponent: () => import('./features/orders/my-order-detail-page.component').then((m) => m.MyOrderDetailPageComponent),
      },
      {
        path: 'account',
        pathMatch: 'full',
        redirectTo: 'account/profile',
      },
      {
        path: 'account/profile',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer'] },
        loadComponent: () => import('./features/account/customer-profile-page.component').then((m) => m.CustomerProfilePageComponent),
      },
      {
        path: 'account/addresses',
        canActivate: [authGuard, roleGuard],
        data: { roles: ['Customer'] },
        loadComponent: () => import('./features/account/customer-addresses-page.component').then((m) => m.CustomerAddressesPageComponent),
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
        path: 'account-settings',
        loadComponent: () => import('./features/legal/account-privacy-page.component').then((m) => m.AccountPrivacyPageComponent),
      },
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
            path: 'orders',
            loadComponent: () => import('./features/driver/driver-available-orders-page.component').then((m) => m.DriverAvailableOrdersPageComponent),
          },
          {
            path: 'active-order',
            loadComponent: () => import('./features/driver/driver-active-order-page.component').then((m) => m.DriverActiveOrderPageComponent),
          },
          {
            path: 'orders/available',
            loadComponent: () => import('./features/driver/driver-available-orders-page.component').then((m) => m.DriverAvailableOrdersPageComponent),
          },
          {
            path: 'orders/my',
            loadComponent: () => import('./features/driver/driver-my-orders-page.component').then((m) => m.DriverMyOrdersPageComponent),
          },
          {
            path: 'orders/:orderId',
            loadComponent: () => import('./features/driver/driver-order-detail-page.component').then((m) => m.DriverOrderDetailPageComponent),
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
            path: 'settings/branding',
            loadComponent: () => import('./features/admin/admin-branding-page.component').then((m) => m.AdminBrandingPageComponent),
          },
          {
            path: 'business-types',
            loadComponent: () => import('./features/admin/admin-business-types-page.component').then((m) => m.AdminBusinessTypesPageComponent),
          },
          {
            path: 'payments',
            loadComponent: () => import('./features/admin/admin-payments-page.component').then((m) => m.AdminPaymentsPageComponent),
          },
          {
            path: 'payments/:orderId',
            loadComponent: () => import('./features/admin/admin-payment-detail-page.component').then((m) => m.AdminPaymentDetailPageComponent),
          },
          {
            path: 'commissions',
            loadComponent: () => import('./features/admin/admin-commissions-page.component').then((m) => m.AdminCommissionsPageComponent),
          },
          {
            path: 'settlements',
            loadComponent: () => import('./features/admin/admin-settlements-page.component').then((m) => m.AdminSettlementsPageComponent),
          },
          {
            path: 'collaborator-verifications',
            loadComponent: () => import('./features/admin/admin-collaborator-verifications-page.component').then((m) => m.AdminCollaboratorVerificationsPageComponent),
          },
          {
            path: 'legal',
            loadComponent: () => import('./features/admin/admin-legal-page.component').then((m) => m.AdminLegalPageComponent),
          },
          {
            path: 'businesses/pending',
            loadComponent: () => import('./features/admin/admin-pending-businesses-page.component').then((m) => m.AdminPendingBusinessesPageComponent),
          },
          {
            path: 'businesses',
            loadComponent: () => import('./features/admin/admin-businesses-page.component').then((m) => m.AdminBusinessesPageComponent),
          },
          {
            path: 'businesses/:id',
            loadComponent: () => import('./features/admin/admin-business-detail-page.component').then((m) => m.AdminBusinessDetailPageComponent),
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

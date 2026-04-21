import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminDashboardPageComponent } from './features/admin/admin-dashboard-page.component';
import { AdminDriverDetailPageComponent } from './features/admin/admin-driver-detail-page.component';
import { AdminDriversPageComponent } from './features/admin/admin-drivers-page.component';
import { AdminPendingDriversPageComponent } from './features/admin/admin-pending-drivers-page.component';
import { AdminPendingRestaurantsPageComponent } from './features/admin/admin-pending-restaurants-page.component';
import { AdminRestaurantDetailPageComponent } from './features/admin/admin-restaurant-detail-page.component';
import { AdminRestaurantsPageComponent } from './features/admin/admin-restaurants-page.component';
import { DriverRegistrationCompletePageComponent } from './features/auth/driver-registration-complete-page.component';
import { DriverRegistrationStartPageComponent } from './features/auth/driver-registration-start-page.component';
import { DriverRegistrationVerifyPageComponent } from './features/auth/driver-registration-verify-page.component';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RestaurantRegistrationCompletePageComponent } from './features/auth/restaurant-registration-complete-page.component';
import { RestaurantRegistrationStartPageComponent } from './features/auth/restaurant-registration-start-page.component';
import { RestaurantRegistrationVerifyPageComponent } from './features/auth/restaurant-registration-verify-page.component';
import { DriverAvailableOrdersPageComponent } from './features/driver/driver-available-orders-page.component';
import { DriverDashboardPageComponent } from './features/driver/driver-dashboard-page.component';
import { DriverMyOrdersPageComponent } from './features/driver/driver-my-orders-page.component';
import { RestaurantCategoriesPageComponent } from './features/restaurant/restaurant-categories-page.component';
import { RestaurantDashboardPageComponent } from './features/restaurant/restaurant-dashboard-page.component';
import { RestaurantItemsPageComponent } from './features/restaurant/restaurant-items-page.component';
import { RestaurantOrdersPageComponent } from './features/restaurant/restaurant-orders-page.component';
import { RestaurantProfilePageComponent } from './features/restaurant/restaurant-profile-page.component';
import { OpsLayoutComponent } from './layout/ops-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register/restaurant', component: RestaurantRegistrationStartPageComponent },
  { path: 'register/restaurant/verify', component: RestaurantRegistrationVerifyPageComponent },
  { path: 'register/restaurant/complete', component: RestaurantRegistrationCompletePageComponent },
  { path: 'register/driver', component: DriverRegistrationStartPageComponent },
  { path: 'register/driver/verify', component: DriverRegistrationVerifyPageComponent },
  { path: 'register/driver/complete', component: DriverRegistrationCompletePageComponent },
  {
    path: '',
    component: OpsLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'restaurant',
        canActivate: [roleGuard],
        data: { roles: ['Restaurant'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', component: RestaurantDashboardPageComponent },
          { path: 'profile', component: RestaurantProfilePageComponent },
          { path: 'menu/categories', component: RestaurantCategoriesPageComponent },
          { path: 'menu/items', component: RestaurantItemsPageComponent },
          { path: 'orders', component: RestaurantOrdersPageComponent },
        ],
      },
      {
        path: 'driver',
        canActivate: [roleGuard],
        data: { roles: ['Driver'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', component: DriverDashboardPageComponent },
          { path: 'orders/available', component: DriverAvailableOrdersPageComponent },
          { path: 'orders/my', component: DriverMyOrdersPageComponent },
        ],
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['Admin'] },
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
          { path: 'dashboard', component: AdminDashboardPageComponent },
          { path: 'restaurants/pending', component: AdminPendingRestaurantsPageComponent },
          { path: 'restaurants', component: AdminRestaurantsPageComponent },
          { path: 'restaurants/:id', component: AdminRestaurantDetailPageComponent },
          { path: 'drivers/pending', component: AdminPendingDriversPageComponent },
          { path: 'drivers', component: AdminDriversPageComponent },
          { path: 'drivers/:id', component: AdminDriverDetailPageComponent },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginPageComponent } from './features/auth/login-page.component';
import { RegisterPageComponent } from './features/auth/register-page.component';
import { MyOrderDetailPageComponent } from './features/orders/my-order-detail-page.component';
import { MyOrdersPageComponent } from './features/orders/my-orders-page.component';
import { RestaurantDetailPageComponent } from './features/restaurants/restaurant-detail-page.component';
import { RestaurantListPageComponent } from './features/restaurants/restaurant-list-page.component';
import { ClientLayoutComponent } from './layout/client-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  {
    path: '',
    component: ClientLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'restaurants' },
      { path: 'restaurants', component: RestaurantListPageComponent },
      { path: 'restaurants/:id', component: RestaurantDetailPageComponent },
      { path: 'orders', component: MyOrdersPageComponent, canActivate: [authGuard] },
      { path: 'orders/:id', component: MyOrderDetailPageComponent, canActivate: [authGuard] },
    ],
  },
  { path: '**', redirectTo: 'restaurants' },
];

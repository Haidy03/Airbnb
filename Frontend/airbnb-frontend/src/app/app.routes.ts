import { Routes } from '@angular/router';
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';
import { AddProperty } from './features/host/components/add-property/add-property';
import { EditProperty } from './features/host/components/edit-property/edit-property';
import { AdminGuard } from './core/guards/admin.guard';
import { ReviewCardComponent } from './features/reviews/components/review-card/review-card.component';
import { AddReviewComponent } from './features/reviews/components/add-review/add-review.component';
import { TestLoginComponent } from './features/auth/components/test-login/test-login.component/test-login.component';
import { BookingFormComponent } from './features/guest/components/booking-form/booking-form';
import { CheckoutComponent } from './features/guest/components/checkout/checkout';
import { LoginComponent } from './features/auth/components/login.component/login.component';

export const routes: Routes = [
  {
    path: 'test-login',
    component: TestLoginComponent
  },
  {
    path: 'login', 
    component: LoginComponent
  },
  {
    path: 'host',
    component: HostLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      { path: 'messages', component: HostMessages },
      { path: 'properties/add', component: AddProperty },
      { path: 'properties/edit/:id', component: EditProperty },
    ]
  },
  {
    path: 'reviews',
    loadChildren: () => import('./features/reviews/review.routes')
      .then(m => m.reviewRoutes)
  },
  {
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
  canActivate: [AdminGuard] // Make sure user is Admin
},
  {
    path: '',
    redirectTo: 'test-login',
    pathMatch: 'full'
  },
  {path: 'login', component: LoginComponent},
];

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
import { LoginComponent } from './features/auth/components/login.component/login.component';

// ✅ Import auth guards
import { authGuard, noAuthGuard } from './features/auth/services/auth.guard';
import { PropertyIntroComponent } from './features/host/components/property-steps/property-intro/property-intro';
import { PropertyTypeComponent } from './features/host/components/property-steps/property-type/property-type';
import { PropertyRoomTypeComponent } from './features/host/components/property-steps/room-type/room-type';
import { PropertyLocationComponent } from './features/host/components/property-steps/property-location/property-location';

export const routes: Routes = [
  {
    path: 'test-login',
    component: TestLoginComponent
  },
  {
    path: 'login', 
    component: LoginComponent,
    canActivate: [noAuthGuard]
  },
  
  // ✅ Host routes - protected by auth guard
  {
    path: 'host',
    component: HostLayoutComponent,
    canActivate: [authGuard], // ✅ Protect entire host section
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      { path: 'messages', component: HostMessages },
      {path: 'properties/addd', component: AddProperty },
      {path: 'properties/edit/:id', component: EditProperty },
    ]
  },

    // ✅ Property creation flow - full-screen, no host layout
  {
    path: 'host/properties',
    canActivate: [authGuard],
    children: [
      { 
        path: 'intro', 
        component: PropertyIntroComponent
      },
      { 
        path: 'property-type', 
        component: PropertyTypeComponent
      },
      { 
        path: 'room-type', 
        component: PropertyRoomTypeComponent
      },
      { 
        path: 'location', 
        component: PropertyLocationComponent
      },
      // Add more steps here as you create them:
      // { path: 'privacy-type', component: PropertyPrivacyComponent },
      // { path: 'location', component: PropertyLocationComponent },
      // { path: 'amenities', component: PropertyAmenitiesComponent },
      // etc.
    ]
  },
  
  // Reviews routes
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
  
  // ✅ Catch-all redirect
  {
    path: '**',
    redirectTo: 'test-login'
  }
];
import { Routes } from '@angular/router';
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
// import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';

import { ReviewCardComponent } from './features/reviews/components/review-card/review-card.component';
import { AddReviewComponent } from './features/reviews/components/add-review/add-review.component';
import { TestLoginComponent } from './features/auth/components/test-login/test-login.component/test-login.component';
import { LoginComponent } from './features/auth/components/login.component/login.component';
import { authGuard, noAuthGuard, hostGuard, adminGuard } from './features/auth/services/auth.guard';
import { PropertyIntroComponent } from './features/host/components/property-steps/property-intro/property-intro';
import { PropertyTypeComponent } from './features/host/components/property-steps/property-type/property-type';
import { PropertyRoomTypeComponent } from './features/host/components/property-steps/room-type/room-type';
import { PropertyLocationComponent } from './features/host/components/property-steps/property-location/property-location';
import { PropertyFloorPlanComponent } from './features/host/components/property-steps/floor-plan/floor-plan';
import { StandOutComponent } from './features/host/components/property-steps/stand-out/stand-out';
import { AmenitiesStepComponent } from './features/host/components/property-steps/amenities/amenities';
import { PropertyPhotosComponent } from './features/host/components/property-steps/photos/photos';

export const routes: Routes = [
  {
    path: 'test-login',
    component: TestLoginComponent
  },
  {
    path: 'login', 
    component: LoginComponent,
    canActivate: [noAuthGuard] // ✅ Redirects to appropriate dashboard if already logged in
  },
  
  // ✅ Host routes - protected by hostGuard (ONLY for Hosts)
  {
    path: 'host',
    component: HostLayoutComponent,
    canActivate: [hostGuard], // ✅ Changed from authGuard to hostGuard
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      // { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      { path: 'messages', component: HostMessages },
      // { path: 'properties/addd', component: AddProperty },
      // { path: 'properties/edit/:id', component: EditProperty },
    ]
  },

  // ✅ Property creation flow - full-screen, no host layout
  {
    path: 'host/properties',
    canActivate: [hostGuard], // ✅ Changed from authGuard to hostGuard
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
      {
        path: 'floor-plan',
        component: PropertyFloorPlanComponent
      },
      {
        path: 'stand-out',
        component: StandOutComponent
      },
      {
        path: 'amenities',
        component: AmenitiesStepComponent
      },
      {
        path: 'photos',
        component: PropertyPhotosComponent
      },
    ]
  },
  
  // ✅ Admin routes - protected by adminGuard (ONLY for Admins)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [adminGuard] // ✅ Changed from AdminGuard to adminGuard
  },
  
  // Reviews routes
  {
    path: 'reviews',
    loadChildren: () => import('./features/reviews/review.routes')
      .then(m => m.reviewRoutes)
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
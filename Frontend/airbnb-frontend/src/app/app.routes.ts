import { Routes } from '@angular/router';
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';
import { AddProperty } from './features/host/components/add-property/add-property';
import { EditProperty } from './features/host/components/edit-property/edit-property';
import { TestLoginComponent } from './features/auth/components/test-login/test-login.component/test-login.component';
import { LoginComponent } from './features/auth/components/login.component/login.component';

// ✅ Import auth guards
import { authGuard, noAuthGuard } from './features/auth/services/auth.guard';
import { PropertyIntroComponent } from './features/host/components/property-steps/property-intro/property-intro';
import { PropertyTypeComponent } from './features/host/components/property-type/property-type';

export const routes: Routes = [

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
        path: 'add-form', 
        component: PropertyTypeComponent
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
  
  // ✅ Default redirect to test-login
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
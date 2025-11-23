import { Routes } from '@angular/router';

// Layouts & Core Components
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HomeComponent } from './features/guest/components/home/home';

// Features Components (Host)
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';
import { AddProperty } from './features/host/components/add-property/add-property';
import { EditProperty } from './features/host/components/edit-property/edit-property';

// Property Steps Components
import { PropertyIntroComponent } from './features/host/components/property-steps/property-intro/property-intro';
import { PropertyTypeComponent } from './features/host/components/property-steps/property-type/property-type';
import { PropertyRoomTypeComponent } from './features/host/components/property-steps/room-type/room-type';
import { PropertyLocationComponent } from './features/host/components/property-steps/property-location/property-location';

// Auth Components
import { TestLoginComponent } from './features/auth/components/test-login/test-login.component/test-login.component';
import { LoginComponent } from './features/auth/components/login.component/login.component';

// Guards
import { authGuard, noAuthGuard, hostGuard, adminGuard } from './features/auth/services/auth.guard';

export const routes: Routes = [
  // =================================================
  // 1. Public / Guest Routes (Merged from Claude's suggestion)
  // =================================================
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'search',
    loadComponent: () => import('./features/guest/components/search/components/search-results/search-results')
      .then(m => m.SearchResultsComponent)
  },
  {
    path: 'wishlists',
    loadComponent: () => import('./features/guest/components/wishlists/wishlists')
      .then(m => m.WishlistsComponent)
  },
  {
    path: 'trips',
    loadComponent: () => import('./features/guest/components/trips/trips')
      .then(m => m.TripsComponent)
  },
  {
    path: 'messages',
    loadComponent: () => import('./features/guest/components/messages/messages')
      .then(m => m.MessagesComponent)
  },
  // {
  //   path: 'profile',
  //   loadComponent: () => import('./features/guest/profile/profile.component')
  //     .then(m => m.ProfileComponent),
  //   canActivate: [authGuard] // ✅ Added authGuard as profile should be protected
  // },
  {
    path: 'account-settings',
    loadComponent: () => import('./features/guest/components/account-settings/account-settings')
      .then(m => m.AccountSettingsComponent),
    canActivate: [authGuard] // ✅ Added authGuard
  },

  // =================================================
  // 2. Auth Routes (Your original work)
  // =================================================
  {
    path: 'test-login',
    component: TestLoginComponent
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [noAuthGuard]
  },

  // =================================================
  // 3. Host Routes (Your original work - Protected)
  // =================================================
  {
    path: 'host',
    component: HostLayoutComponent,
    canActivate: [hostGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      { path: 'messages', component: HostMessages },
      { path: 'properties/addd', component: AddProperty },
      { path: 'properties/edit/:id', component: EditProperty },
    ]
  },

  // =================================================
  // 4. Property Creation Flow (Your original work)
  // =================================================
  {
    path: 'host/properties',
    canActivate: [hostGuard],
    children: [
      { path: 'intro', component: PropertyIntroComponent },
      { path: 'property-type', component: PropertyTypeComponent },
      { path: 'room-type', component: PropertyRoomTypeComponent },
      { path: 'location', component: PropertyLocationComponent },
    ]
  },

  // =================================================
  // 5. Admin Routes (Your original work)
  // =================================================
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [adminGuard]
  },

  // =================================================
  // 6. Feature Routes (Reviews)
  // =================================================
  {
    path: 'reviews',
    loadChildren: () => import('./features/reviews/review.routes')
      .then(m => m.reviewRoutes)
  },

  // =================================================
  // 7. Wildcard / 404 Handling
  // =================================================
  // Note: Changed catch-all to redirect to Home instead of test-login for better UX
  {
    path: '**',
    redirectTo: ''
  }
];

import { Routes } from '@angular/router';

// Layouts & Core Components
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HomeComponent } from './features/guest/components/home/home';

// Features Components (Host)
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
// import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';

import { ReviewCardComponent } from './features/reviews/components/review-card/review-card.component';
import { AddReviewComponent } from './features/reviews/components/add-review/add-review.component';

import { PropertyIntroComponent } from './features/host/components/property-steps/property-intro/property-intro';
import { PropertyTypeComponent } from './features/host/components/property-steps/property-type/property-type';
import { PropertyRoomTypeComponent } from './features/host/components/property-steps/room-type/room-type';
import { PropertyLocationComponent } from './features/host/components/property-steps/property-location/property-location';
import { ProfileComponent } from './features/profile/components/profile.component/profile.component';
import { AboutMeComponent } from './features/profile/components/about-me.component/about-me.component';
import { ProfileEditComponent } from './features/profile/components/profile-edit.component/profile-edit.component';
import { PastTripsComponent } from './features/profile/components/past-trips.component/past-trips.component';
import { ConnectionsComponent } from './features/profile/components/connections.component/connections.component';
import { PropertyFloorPlanComponent } from './features/host/components/property-steps/floor-plan/floor-plan';
import { AmenitiesStepComponent } from './features/host/components/property-steps/amenities/amenities';
import { PropertyPhotosComponent } from './features/host/components/property-steps/photos/photos';
import { StandOutComponent } from './features/host/components/property-steps/stand-out/stand-out';
import { PropertyTitleComponent } from './features/host/components/property-steps/title/title';
import { PropertyDescriptionComponent } from './features/host/components/property-steps/description/description';
import { legalandcreateComponent } from './features/host/components/property-steps/legal-and-create/legal-and-create';
import { PricingComponent } from './features/host/components/property-steps/pricing/pricing';
import { FinishsetupComponent } from './features/host/components/property-steps/finish-setup/finish-setup';
import { instantBookComponent } from './features/host/components/property-steps/instant-book/instant-book';


// Auth Components
import { TestLoginComponent } from './features/auth/components/test-login/test-login.component/test-login.component';
import { LoginComponent } from './features/auth/components/login.component/login.component';

// Guards
import { authGuard, noAuthGuard, hostGuard, adminGuard } from './features/auth/services/auth.guard';
import { MessagesInboxComponent } from './features/messages/messages/messages';
import { ChatComponent } from './features/messages/chat/chat';
import { MessageTestComponent } from './test/test/test';
import { ListingDetails } from './features/guest/components/listing-details/listing-details';
import { Checkout } from './features/guest/components/checkout/checkout';
import { HostCalendar } from './features/host/components/host-calendar/host-calendar';

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

  // {
  //   path: 'messages',
  //   loadComponent: () => import('./features/guest/components/messages/messages')
  //     .then(m => m.MessagesComponent)
  // },
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
   { path: 'listing/:id', component: ListingDetails },
    { path: 'checkout/:id', component: Checkout },

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

  // ✅ Host routes - protected by hostGuard (ONLY for Hosts)
  // ✅ Host routes - protected by auth guard

  // =================================================
  // 3. Host Routes (Your original work - Protected)
  // =================================================
  {
    path: 'host',
    component: HostLayoutComponent,
    //canActivate: [hostGuard], // ✅ Changed from authGuard to hostGuard
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      // {
      //   path: 'properties/:id',
      //   component: PropertyDetailsComponent
      // }
      // { path: 'messages', component: HostMessages },
      // { path: 'properties/addd', component: AddProperty },
      // { path: 'properties/edit/:id', component: EditProperty },
    ]
  },

  //TESTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT
    {
    path: 'test/messages',
    component: MessageTestComponent
  },

  // =================================================
  // 4. Property Creation Flow (Your original work)
  // =================================================
  {
    path: 'host/properties',
    //canActivate: [hostGuard], // ✅ Changed from authGuard to hostGuard
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
      {
        path: 'title',
        component: PropertyTitleComponent
      },
      {
        path: 'description',
        component: PropertyDescriptionComponent
      },
      {
        path: 'instant-book',
        component: instantBookComponent
      },
      {
        path: 'finish-setup',
        component: FinishsetupComponent
      },
      {
        path: 'pricing',
        component: PricingComponent
      },
      {
        path: 'legal-and-create',
        component: legalandcreateComponent
      },

    ]
  },

   {
    path: 'messages',
    children: [
      {
        path: '',
        component: MessagesInboxComponent,
        title: 'Messages'
      },
      {
        path: ':id',
        component: ChatComponent,
        title: 'Chat'
      }
    ]
  },
  
 
  {
    path: 'host/messages',
    children: [
      {
        path: '',
        component: MessagesInboxComponent,
        title: 'Host Messages'
      },
      {
        path: ':id',
        component: ChatComponent,
        title: 'Host Chat'
      }
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

  // Reviews routes

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

 import { Routes } from '@angular/router';
import { NotFoundComponent } from './shared/components/not-found/not-found';
// Layouts & Core Components
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HomeComponent } from './features/guest/components/home/home';
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';
import { ReviewCardComponent } from './features/reviews/components/review-card/review-card.component';
import { AddReviewComponent } from './features/reviews/components/add-review/add-review.component';
import { PropertyIntroComponent } from './features/host/components/property-steps/property-intro/property-intro';
import { PropertyTypeComponent } from './features/host/components/property-steps/property-type/property-type';
import { PropertyRoomTypeComponent } from './features/host/components/property-steps/room-type/room-type';
import { PropertyLocationComponent } from './features/host/components/property-steps/property-location/property-location';
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
import { TestLoginComponent } from './features/auth/components/test-login/test-login.component/test-login.component';
import { LoginComponent } from './features/auth/components/login.component/login.component';
import { authGuard, noAuthGuard, hostGuard, adminGuard } from './features/auth/services/auth.guard';
import { ListingDetails } from './features/guest/components/listing-details/listing-details';
import { Checkout } from './features/guest/components/checkout/checkout';
import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { ResetPasswordComponent } from './features/auth/components/reset-password.component/reset-password.component';
import { PropertyEditorComponent } from './features/host/components/property-editor/property-editor';
import { BookingDetailsComponent } from './features/host/components/booking-details/booking-details';
import { experiencesRoutes } from './features/experience/experiences.routes';
import { ProfileEditComponent } from './features/profile/components/profile-edit.component/profile-edit.component';
import { PastTripsComponent } from './features/profile/components/past-trips.component/past-trips.component';
import { ConnectionsComponent } from './features/profile/components/connections.component/connections.component';
import { AboutMeComponent } from './features/profile/components/about-me.component/about-me.component';
import { ProfileComponent } from './features/profile/components/profile.component/profile.component';
import { HostReviewsComponent } from './features/host/components/host-reviews/host-reviews';
import { SendMessage } from './features/guest/components/send-message/send-message';
import { HostEarningsComponent } from './features/host/components/earnings/earnings';
import { MainLayoutComponent } from './layouts/main-layout/main-layout/main-layout';
import { PropertyCreationLayoutComponent } from './layouts/property-creation-layout/property-creation-layout/property-creation-layout';

export const routes: Routes = [
  // =================================================
  // 1. Public / Guest Routes (Merged from Claude's suggestion)
  // =================================================
  {
    path: '',
    component: MainLayoutComponent,
    children: [
    { path: '', component: HomeComponent },
  
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
  },{
  path: 'messages',
    loadComponent: () => import('./features/messages/Components/messages-inbox').then(m => m.MessagesInboxComponent)
  },

  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard], 
    children: [
    {path: '', redirectTo: 'about-me', pathMatch: 'full' },
    {path: 'about-me', component: AboutMeComponent },
    {path: 'edit-profile', component: ProfileEditComponent },
    {path: 'past-trips', component: PastTripsComponent },
    {path: 'connections', component: ConnectionsComponent },
    ]
  },
  {
    path: 'account-settings',
    loadComponent: () => import('./features/guest/components/account-settings/account-settings')
      .then(m => m.AccountSettingsComponent),
    canActivate: [authGuard] // ✅ Added authGuard
  },
   { path: 'listing/:id', component: ListingDetails },
    { path: 'checkout/:id', component: Checkout },
     { path: 'send-message/:id', component: SendMessage },

    ]},
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
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
  path: 'experiences',
  children: experiencesRoutes
},

  // =================================================
  // 3. Host Routes (Your original work - Protected)
  // =================================================
  {
    path: 'host',
    component: HostLayoutComponent,
    canActivate: [hostGuard], // ✅ Changed from authGuard to hostGuard
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      { path: 'bookings/:id', component: BookingDetailsComponent },
      {
        path: 'properties/editor/:id',
        component: PropertyEditorComponent
      },{
        path: 'messages',
        loadComponent: () => import('./features/messages/Components/messages-inbox').then(m => m.MessagesInboxComponent)
      },
      {
      path: 'experiences',
      loadComponent: () => import('./features/experience/components/host/host-experiences/host-experiences.component/host-experiences.component')
        .then(m => m.HostExperiencesComponent),
      title: 'My Experiences - Host'
    },
    {
      path: 'experiences/create',
      loadComponent: () => import('./features/experience/components/host/create-experience/create-experience.component/create-experience.component')
        .then(m => m.CreateExperienceComponent),
      title: 'Create Experience - Host'
    },
    {
      path: 'experiences/:id/edit',
      loadComponent: () => import('./features/experience/components/host/create-experience/create-experience.component/create-experience.component')
        .then(m => m.CreateExperienceComponent),
      title: 'Edit Experience - Host'
    },
      // {
      //   path: 'properties/:id',
      //   component: PropertyDetailsComponent
      // }
      // { path: 'messages', component: HostMessages },
      // { path: 'properties/addd', component: AddProperty },
      // { path: 'properties/edit/:id', component: EditProperty },
      { path: 'earnings', component: HostEarningsComponent },
      { path: 'reviews', component: HostReviewsComponent },
      {
        path: 'profile', 
        loadComponent: () => import('./features/profile/components/profile.component/profile.component').then(m => m.ProfileComponent),
        children: [
            { path: '', redirectTo: 'about-me', pathMatch: 'full' },
            { path: 'about-me', loadComponent: () => import('./features/profile/components/about-me.component/about-me.component').then(m => m.AboutMeComponent) },
            { 
              path: 'edit-profile', 
              loadComponent: () => import('./features/profile/components/profile-edit.component/profile-edit.component').then(m => m.ProfileEditComponent) 
            },
            { 
              path: 'past-trips', 
              loadComponent: () => import('./features/profile/components/past-trips.component/past-trips.component').then(m => m.PastTripsComponent) 
            },
          ]
      }
    ]
  },

  // =================================================
  // 4. Property Creation Flow (Your original work)
  // =================================================
  {
    path: 'host/properties',
    component: PropertyCreationLayoutComponent,
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

  { path: 'not-found', component: NotFoundComponent },
  {
    path: '**',
    redirectTo: 'not-found'
  }
];

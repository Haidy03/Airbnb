import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component/admin-layout.component';
import { AdminDashboardComponent } from './components/dashboard/dashboard.component/dashboard.component';
import { AdminUsersComponent } from './components/users/users.component/users.component';
import { AdminPropertiesComponent } from './components/properties/properties.component/properties.component';
import { AdminBookingsComponent } from './components/bookings/bookings.component/bookings.component';
import { AdminAnalyticsComponent } from './components/analytics/analytics.component/analytics.component';
import { AdminSettingsComponent } from './components/settings/settings.component/settings.component';
import { AdminExperiencesComponent } from './/components/experiences/admin-experiences.component/admin-experiences.component';

import { AdminGuard } from '../../core/guards/admin.guard';


export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: AdminUsersComponent },
      { path: 'experiences', component: AdminExperiencesComponent },
      { path: 'properties', component: AdminPropertiesComponent },
      { path: 'bookings', component: AdminBookingsComponent },
      { path: 'analytics', component: AdminAnalyticsComponent },
      { path: 'settings', component: AdminSettingsComponent },
      // { path: 'disputes', component: AdminDisputesComponent }, // Add later if needed
    ]
  }
];
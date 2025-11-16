import { Routes } from '@angular/router';
import { HostLayoutComponent } from './layouts/host-layout/host-layout';
import { HostDashboardComponent } from './features/host/components/host-dashboard/host-dashboard';
import { HostCalendar } from './features/host/components/host-calendar/host-calendar';
import { MyProperties } from './features/host/components/my-properties/my-properties';
import { HostMessages } from './features/host/components/host-messages/host-messages';

export const routes: Routes = [
  {
    path: 'host',
    component: HostLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: HostDashboardComponent },
      { path: 'calendar', component: HostCalendar },
      { path: 'properties', component: MyProperties },
      { path: 'messages', component: HostMessages },
      // Add more routes here as we build them
    ]
  },
  { path: '', redirectTo: 'host/dashboard', pathMatch: 'full' }
];
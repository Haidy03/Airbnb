import { Routes } from '@angular/router';

export const routes: Routes = [

    // Host Routes
  {
    path: 'host',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/host/components/host-dashboard/host-dashboard')
          .then(m => m.HostDashboard)
      },
      {
        path: 'my-properties',
        loadComponent: () => import('./features/host/components/my-properties/my-properties')
          .then(m => m.MyProperties)
      },
      {
        path: 'add-property',
        loadComponent: () => import('./features/host/components/add-property/add-property')
          .then(m => m.AddProperty)
      },
      {
        path: 'edit-property/:id',
        loadComponent: () => import('./features/host/components/edit-property/edit-property')
          .then(m => m.EditProperty)
      },
      {
        path: '',
        redirectTo: 'my-properties',
        pathMatch: 'full'
      }
    ]
  },
  
  // Default redirect
  {
    path: '',
    redirectTo: 'host/my-properties',
    pathMatch: 'full'
  },
  
  // 404
  {
    path: '**',
    redirectTo: 'host/my-properties'
  }
];


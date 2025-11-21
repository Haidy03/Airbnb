import { Routes } from '@angular/router';
import { noAuthGuard } from './services/auth.guard';

// Note: LoginComponent is used as a modal, not routed
// You can add additional auth routes here if needed

export const authRoutes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: '',
        redirectTo: '/',
        pathMatch: 'full'
      }
    ]
  }
];
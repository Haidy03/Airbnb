import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const reviewRoutes: Routes = [
  {
    path: 'add/:bookingId',
    loadComponent: () => 
      import('./components/add-review/add-review.component').then(m => m.AddReviewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => 
      import('./pages/edit-review.component').then(m => m.EditReviewComponent),
    canActivate: [authGuard]
  },
  {
    path: 'my-reviews',
    loadComponent: () => 
      import('./components/my-reviews/my-reviews').then(m => m.MyReviews),
    canActivate: [authGuard]
  },
  {
    path: 'property/:propertyId',
    loadComponent: () => 
      import('./components/property-reviews/property-reviews').then(m => m.PropertyReviews)
  }
];
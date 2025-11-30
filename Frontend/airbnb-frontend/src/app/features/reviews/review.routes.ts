// src/app/features/reviews/review.routes.ts

import { Routes } from '@angular/router';

export const reviewRoutes: Routes = [
  {
    path: 'add/:bookingId',
    loadComponent: () => 
      import('./components/add-review/add-review.component').then(m => m.AddReviewComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => 
      import('./pages/edit-review.component').then(m => m.EditReviewComponent)
  },
  {
    path: 'my-reviews',
    loadComponent: () => 
      import('./components/my-reviews/my-reviews').then(m => m.MyReviews)
  },
  {
    path: 'experience/:id',
    loadComponent: () => import('./components/experience-review/experience-reviews.component/experience-reviews.component').then(m => m.ExperienceReviewsComponent)
  },
  {
    path: 'property/:propertyId',
    loadComponent: () => 
      import('./components/property-reviews/property-reviews').then(m => m.PropertyReviews)
  }
];
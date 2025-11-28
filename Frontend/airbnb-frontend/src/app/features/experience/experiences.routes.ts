import { Routes } from '@angular/router';
import { authGuard } from '../auth/services/auth.guard';

export const experiencesRoutes: Routes = [
  // Public Routes - Experiences Home
  {
    path: '',
    loadComponent: () => import('./components/experiences-home/experiences-home.component/experiences-home.component')
      .then(m => m.ExperiencesHomeComponent),
    title: 'Experiences - Airbnb'
  },
  
  // Experience Details Page
  {
    path: ':id',
    loadComponent: () => import('./components/experience-details/experience-details/experience-details')
      .then(m => m.ExperienceDetailsComponent),
    title: 'Experience Details - Airbnb'
  },

  // ✅ NEW: Experience Booking Page (Protected)
  {
    path: ':id/book',
    loadComponent: () => import('./components/experience-booking/experience-booking.component/experience-booking.component')
      .then(m => m.ExperienceBookingComponent),
    canActivate: [authGuard],
    title: 'Book Experience - Airbnb'
  }
];
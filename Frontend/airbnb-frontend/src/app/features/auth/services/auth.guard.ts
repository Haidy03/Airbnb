import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

// ✅ Auth Guard - Protects routes that require authentication
export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔒 Auth Guard - Checking authentication...');
  console.log('🔒 Is Authenticated:', authService.isAuthenticated);
  console.log('🔒 Token:', authService.getToken());

  if (authService.isAuthenticated) {
    console.log('✅ Auth Guard - User is authenticated');
    return true;
  }

  console.log('❌ Auth Guard - User is NOT authenticated, redirecting to test-login');
  // Redirect to login page and store return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: router.url }
  });
};

// ✅ No Auth Guard - Redirects authenticated users away from login pages
export const noAuthGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated) {
    return true;
  }

  // Redirect authenticated users to host dashboard
  return router.createUrlTree(['/host/dashboard']);
};
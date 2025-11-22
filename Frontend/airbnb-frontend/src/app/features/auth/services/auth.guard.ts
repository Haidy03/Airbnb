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

  console.log('❌ Auth Guard - User is NOT authenticated, redirecting to login');
  // Redirect to login page and store return URL
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: router.url }
  });
};

// ✅ No Auth Guard - Redirects authenticated users away from login pages
export const noAuthGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔓 No Auth Guard - Checking if user is already logged in...');

  if (!authService.isAuthenticated) {
    console.log('✅ No Auth Guard - User is NOT authenticated, allowing access to login');
    return true;
  }

  // Get current user role from token or user object
  const token = authService.getToken();
  let userRole = '';
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '').toLowerCase();
    } catch (e) {
      console.error('Error parsing token:', e);
    }
  }

  console.log('👤 No Auth Guard - User is authenticated, role:', userRole);

  // Redirect based on role
  if (userRole === 'admin') {
    console.log('🔄 Redirecting Admin to /admin/dashboard');
    return router.createUrlTree(['/admin/dashboard']);
  } else if (userRole === 'host') {
    console.log('🔄 Redirecting Host to /host/dashboard');
    return router.createUrlTree(['/host/dashboard']);
  } else {
    console.log('🔄 Redirecting Guest to /');
    return router.createUrlTree(['/']);
  }
};

// ✅ Host Guard - Only allows Hosts to access
export const hostGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🏠 Host Guard - Checking if user is Host...');

  if (!authService.isAuthenticated) {
    console.log('❌ Host Guard - User not authenticated, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // Get current user role from token
  const token = authService.getToken();
  let userRole = '';
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '').toLowerCase();
    } catch (e) {
      console.error('Error parsing token:', e);
    }
  }

  console.log('👤 Host Guard - User role:', userRole);

  if (userRole === 'host') {
    console.log('✅ Host Guard - User is Host, allowing access');
    return true;
  }

  // Redirect based on role
  if (userRole === 'admin') {
    console.log('🔄 Host Guard - User is Admin, redirecting to admin dashboard');
    return router.createUrlTree(['/admin/dashboard']);
  } else {
    console.log('🔄 Host Guard - User is Guest, redirecting to home');
    return router.createUrlTree(['/']);
  }
};

// ✅ Admin Guard - Only allows Admins to access
export const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('👑 Admin Guard - Checking if user is Admin...');

  if (!authService.isAuthenticated) {
    console.log('❌ Admin Guard - User not authenticated, redirecting to login');
    return router.createUrlTree(['/login']);
  }

  // Get current user role from token
  const token = authService.getToken();
  let userRole = '';
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userRole = (payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '').toLowerCase();
    } catch (e) {
      console.error('Error parsing token:', e);
    }
  }

  console.log('👤 Admin Guard - User role:', userRole);

  if (userRole === 'admin') {
    console.log('✅ Admin Guard - User is Admin, allowing access');
    return true;
  }

  // Redirect based on role
  if (userRole === 'host') {
    console.log('🔄 Admin Guard - User is Host, redirecting to host dashboard');
    return router.createUrlTree(['/host/dashboard']);
  } else {
    console.log('🔄 Admin Guard - User is Guest, redirecting to home');
    return router.createUrlTree(['/']);
  }
};